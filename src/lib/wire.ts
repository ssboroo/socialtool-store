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
  const key = process.env.WIRE_MN_API_KEY?.trim()
  return !!key && key !== 'your_wire_mn_api_key'
}

function getApiKey(): string {
  const key = process.env.WIRE_MN_API_KEY?.trim()
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
function getAllowedOperators(): string[] | undefined {
  const live = getApiKey().startsWith('sk_live_')
  const ops = (process.env.WIRE_MN_ALLOWED_OPERATORS || '').split(',').map(s => s.trim()).filter(Boolean)
  // Never send a legacy sandbox filter with a live key.
  // An omitted filter delegates to the project's connected live operators.
  if (live) {
    const liveOperators = ops.filter(op => op !== 'sandbox')
    return liveOperators.length ? liveOperators : undefined
  }
  if (!live && ops.some(op => op !== 'sandbox')) {
    throw new WireApiError('Туршилтын түлхүүрт WIRE_MN_ALLOWED_OPERATORS=sandbox тохируулна уу.', 503, 'operator_configuration')
  }
  return ops.length ? ops : ['sandbox']
}

export class WireApiError extends Error {
  status: number
  code?: string
  requestId?: string
  constructor(message: string, status: number, code?: string, requestId?: string) {
    super(message)
    this.name = 'WireApiError'
    this.status = status
    this.code = code
    this.requestId = requestId
  }
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
    signal: AbortSignal.timeout(15000),
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey('pi', opts.orderId),
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw wireError('PaymentIntent үүсгэх', res.status, text)
  }
  return (await res.json()) as WirePaymentIntent
}

/**
 * Step 2 — Create a checkout session for a PaymentIntent.
 * Wire's hosted-checkout guide documents form encoding. Some live deployments
 * currently reject that body as non-JSON, so retry once with an equivalent JSON
 * body only when the provider explicitly reports a JSON-body parse error.
 */
export async function createCheckoutSession(opts: {
  paymentIntentId: string
  orderId: string
  successUrl?: string
}): Promise<WireCheckoutSession> {
  const key = getApiKey()
  const checkoutUrl = `${API_BASE}/checkout/sessions`
  const idemKey = idempotencyKey('cs', opts.paymentIntentId)
  const payload: { payment_intent: string; success_url?: string } = {
    payment_intent: opts.paymentIntentId,
  }
  if (opts.successUrl) payload.success_url = opts.successUrl

  const form = new URLSearchParams()
  form.set('payment_intent', payload.payment_intent)
  if (payload.success_url) form.set('success_url', payload.success_url)

  let res = await fetch(checkoutUrl, {
    method: 'POST',
    signal: AbortSignal.timeout(15000),
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Idempotency-Key': idemKey,
    },
    body: form.toString(),
  })

  if (!res.ok) {
    const firstText = await res.text().catch(() => '')
    let providerMessage = ''
    try {
      const parsed = JSON.parse(firstText)
      providerMessage = String(parsed?.error?.message || parsed?.message || '')
    } catch { /* non-JSON error response */ }

    const wantsJson = res.status === 400 && /(?:request body|body).*(?:not valid|invalid).*json|json.*(?:not valid|invalid)/i.test(providerMessage || firstText)
    if (!wantsJson) throw wireError('Checkout session үүсгэх', res.status, firstText)

    res = await fetch(checkoutUrl, {
      method: 'POST',
      signal: AbortSignal.timeout(15000),
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idemKey,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const secondText = await res.text().catch(() => '')
      throw wireError('Checkout session үүсгэх', res.status, secondText)
    }
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
    signal: AbortSignal.timeout(15000),
    headers: {
      Authorization: `Bearer ${key}`,
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw wireError('PaymentIntent татах', res.status, text)
  }
  return (await res.json()) as WirePaymentIntentRetrieve
}

/** Verify WirePayment-Signature: t=<unix seconds>,v1=<HMAC SHA256>.
 * See https://docs.wire.mn/docs/guides/webhooks. Reject stale/replayed deliveries.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.WIRE_MN_WEBHOOK_SECRET
  if (!secret || secret === 'whsec_replace_with_your_endpoint_signing_secret') return false
  const parts = signature.split(',').map((part) => part.trim())
  const timestamps = parts.filter((part) => part.startsWith('t='))
  if (timestamps.length !== 1) return false
  const timestamp = timestamps[0].slice(2)
  if (!/^\d+$/.test(timestamp)) return false
  const seconds = Number(timestamp)
  if (!Number.isSafeInteger(seconds) || Math.abs(Date.now() / 1000 - seconds) > 300) return false
  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest()
  return parts.filter((part) => part.startsWith('v1=')).some((part) => {
    const hex = part.slice(3)
    return /^[a-f0-9]{64}$/i.test(hex) && crypto.timingSafeEqual(expected, Buffer.from(hex, 'hex'))
  })
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
function wireError(action: string, status: number, body: string): WireApiError {
  let error: { code?: string; request_id?: string; message?: string; param?: string } = {}
  try { error = JSON.parse(body)?.error || {} } catch { /* Never expose raw provider HTML or secrets. */ }
  const messages: Record<string, string> = {
    operator_unknown: 'Wire операторын ID-г танихгүй байна. Railway → WIRE_MN_ALLOWED_OPERATORS дахь мерчант UUID/буруу утгыг арилгаж хоосон хадгалаад deploy хийнэ үү. Эсвэл Wire API-аас авсан идэвхтэй операторын ID оруулна уу.',
    connector_required: 'Wire → Суваг хэсэгт төлбөрийн оператороо холбоно уу.',
    settlement_account_required: 'Wire → Данс хэсэгт орлого хүлээн авах дансаа сонгоно уу.',
    dan_verification_required: 'Wire бүртгэлийн ДАН баталгаажуулалтыг гүйцээнэ үү.',
    operator_not_allowed: 'API түлхүүрийн горим болон идэвхтэй операторын тохиргоо зөрж байна.',
    idempotency_in_flight: 'Нэхэмжлэл боловсруулагдаж байна. 1–2 секундын дараа дахин оролдоно уу.',
    payment_intent_unexpected_state: 'Нэхэмжлэлийн хугацаа эсвэл төлөв өөрчлөгдсөн. Дахин оролдоно уу.',
    checkout_url_invalid: 'Серверийн NEXT_PUBLIC_SITE_URL-д сайтын бүтэн HTTPS хаягийг тохируулна уу.',
  }
  const providerMessage = typeof error.message === 'string' && error.message.trim() && error.message.length <= 500
    ? error.message.trim()
    : undefined
  const message = (error.code && messages[error.code])
    || (status === 401 ? 'Wire API түлхүүр хүчингүй байна. Зөв project-ийн түлхүүрийг серверт тохируулна уу.' : undefined)
    || providerMessage
    || `${action}ад алдаа гарлаа (HTTP ${status}).`

  console.error('Wire API request failed', {
    action,
    status,
    code: error.code || 'unknown',
    param: error.param || undefined,
    requestId: error.request_id || undefined,
  })

  return new WireApiError(message, status, error.code, error.request_id)
}
