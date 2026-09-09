/**
 * Wire.mn payment gateway integration (real API).
 *
 * Flow (per https://wire.mn quickstart):
 *   1. createPaymentIntent()      — POST /v1/payment_intents  (Idempotency-Key required)
 *   2. createCheckoutSession()    — POST /v1/checkout/sessions  → returns hosted pay URL
 *   3. Webhook                    — payment_intent.succeeded  → verify signature with whsec_...
 *
 * Amounts are MNT minor units: 50000 = 500.00 ₮ (100 minor units per 1 MNT, per ISO 4217).
 * Idempotency-Key header is required on all mutating POSTs.
 *
 * Credentials are kept in environment variables — never exposed to the frontend.
 */
import crypto from 'crypto'

const API_BASE = process.env.WIRE_MN_API_URL || 'https://api.wire.mn/v1'

export interface WirePaymentIntent {
  id: string
  object: string
  amount: number
  currency: string
  status: string
  client_secret?: string
}

export interface WireCheckoutSession {
  id: string
  object: string
  url: string
  payment_intent: string
  status?: string
}

export interface WirePaymentIntentRetrieve {
  id: string
  status: string
  amount: number
  currency: string
}

/** True when a real API key is configured (sk_test_ or sk_live_). */
function isConfigured(): boolean {
  const key = process.env.WIRE_MN_API_KEY
  return !!key && key !== 'your_wire_mn_api_key'
}

function getApiKey(): string {
  const key = process.env.WIRE_MN_API_KEY
  if (!key || key === 'your_wire_mn_api_key') {
    throw new Error('WIRE_MN_API_KEY тохируулаагүй байна. .env файлыг шалгана уу.')
  }
  return key
}

/** Convert MNT face value to Wire.mn minor units (1 MNT = 100 minor units). */
export function toMinorUnits(mnt: number): number {
  return Math.round(mnt * 100)
}

/** Parse the comma-separated WIRE_MN_ALLOWED_OPERATORS env var (default ["sandbox"]). */
function getAllowedOperators(): string[] {
  const raw = process.env.WIRE_MN_ALLOWED_OPERATORS
  if (!raw) return ['sandbox']
  const ops = raw.split(',').map((s) => s.trim()).filter(Boolean)
  return ops.length > 0 ? ops : ['sandbox']
}

/** Generate a stable idempotency key for a given scope+id. */
function idempotencyKey(scope: string, id: string): string {
  return `${scope}-${id}`
}

/**
 * Step 1 — Create a PaymentIntent.
 * POST /v1/payment_intents with Idempotency-Key header.
 * Returns the intent (status: requires_payment_method initially).
 */
export async function createPaymentIntent(opts: {
  orderId: string
  amount: number // MNT face value (e.g. 89000)
  description?: string
}): Promise<WirePaymentIntent> {
  const key = getApiKey()
  const body = {
    amount: toMinorUnits(opts.amount),
    currency: 'MNT',
    description: opts.description,
    allowed_operators: getAllowedOperators(),
  }
  const res = await fetch(`${API_BASE}/payment_intents`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey('pi', opts.orderId),
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(wireError('PaymentIntent үүсгэх', res.status, text))
  }
  return (await res.json()) as WirePaymentIntent
}

/**
 * Step 2 — Create a checkout session for a PaymentIntent.
 * POST /v1/checkout/sessions → returns hosted pay URL on pay.wire.mn.
 * The intent must still be in requires_payment_method state.
 */
export async function createCheckoutSession(opts: {
  paymentIntentId: string
  orderId: string
  successUrl: string
}): Promise<WireCheckoutSession> {
  const key = getApiKey()
  const body = new URLSearchParams()
  body.set('payment_intent', opts.paymentIntentId)
  body.set('success_url', opts.successUrl)

  const res = await fetch(`${API_BASE}/checkout/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Idempotency-Key': idempotencyKey('cs', opts.orderId),
    },
    body: body.toString(),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(wireError('Checkout session үүсгэх', res.status, text))
  }
  return (await res.json()) as WireCheckoutSession
}

/**
 * Retrieve a PaymentIntent's status directly from Wire.mn (server-side fallback
 * for status polling when the webhook hasn't fired yet or isn't configured).
 */
export async function retrievePaymentIntent(paymentIntentId: string): Promise<WirePaymentIntentRetrieve> {
  const key = getApiKey()
  const res = await fetch(`${API_BASE}/payment_intents/${paymentIntentId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${key}`,
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(wireError('PaymentIntent татах', res.status, text))
  }
  return (await res.json()) as WirePaymentIntentRetrieve
}

/**
 * Verify the webhook signature. Wire.mn sends an HMAC-SHA256 signature in a
 * header (commonly `Wire-Signature` / `X-Wire-Signature` / `X-Signature`) computed
 * over the raw request body using the endpoint's signing secret (whsec_...).
 *
 * If no webhook secret is configured yet, verification fails — callers should
 * fall back to the polling endpoint which queries the Wire.mn API directly.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.WIRE_MN_WEBHOOK_SECRET
  if (!secret || secret === 'whsec_replace_with_your_endpoint_signing_secret') {
    // No signing secret configured — refuse the webhook so the merchant
    // is forced to wire it up. The status polling endpoint still verifies
    // payments server-side via the Wire.mn API as a fallback.
    return false
  }
  if (!signature) return false
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  try {
    // constant-time compare to prevent timing attacks
    const a = Buffer.from(expected, 'hex')
    const b = Buffer.from(signature, 'hex')
    if (a.length !== b.length) {
      // also accept the hex string comparison as a fallback for non-hex formats
      return expected === signature
    }
    return crypto.timingSafeEqual(a, b)
  } catch {
    // signature wasn't hex — compare as strings
    return expected === signature
  }
}

/** Map a Wire.mn payment intent status to our internal status. */
export function mapIntentStatus(status: string): 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' {
  const s = (status || '').toLowerCase()
  if (s === 'succeeded' || s === 'paid') return 'PAID'
  if (s === 'failed' || s === 'canceled' || s === 'cancelled') return 'FAILED'
  if (s === 'expired') return 'EXPIRED'
  // requires_payment_method, requires_confirmation, processing, requires_action → PENDING
  return 'PENDING'
}

/** Build a human-readable error message from a Wire.mn error response. */
function wireError(action: string, status: number, body: string): string {
  let detail = body
  try {
    const parsed = JSON.parse(body)
    detail = parsed?.error?.message || parsed?.message || body
  } catch {
    /* keep raw body */
  }
  // surface well-known merchant-setup errors clearly
  if (body.includes('connector_required')) {
    return `${action}ад алдаа: оператор холбоогүй байна (connector_required). Wire.mn dashboard-аас оператор идэвхжүүлнэ үү.`
  }
  if (body.includes('settlement_account_required')) {
    return `${action}ад алдаа: орлогын данс холбоогүй байна (settlement_account_required). Wire.mn dashboard-аас төлбөр хүлээн авах данс холгоно уу.`
  }
  return `${action}ад алдаа (HTTP ${status}): ${detail}`
}
