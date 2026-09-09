import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyWebhookSignature, mapIntentStatus } from '@/lib/wire'
import { sendTelegramMessage, formatPaymentConfirmedNotification } from '@/lib/telegram'

/**
 * Wire.mn webhook callback.
 *
 * Verification flow: when you add the endpoint in the Wire.mn dashboard and
 * click "Баталгаажуулах", Wire sends a signed ping to this URL. If we return
 * 2xx, the endpoint is activated. We:
 *   - Always respond 200 to `ping` / `endpoint.verify` events (verification).
 *   - Verify the HMAC-SHA256 signature for real events.
 *   - Update order status only for `payment_intent.succeeded` / `.failed`.
 *
 * Event types handled:
 *   - ping / endpoint.verify            → 200 OK (verification)
 *   - payment_intent.succeeded          → mark PAID, notify admin
 *   - payment_intent.failed             → mark FAILED
 *
 * Never trusts the frontend redirect alone. When the webhook secret isn't
 * configured yet, verification fails here — the status polling endpoint
 * (/api/payment/wire/status) still verifies payments server-side via the
 * Wire.mn API as a fallback.
 */

/** Health/verification probe — Wire.mn checks the endpoint is reachable. */
export async function GET() {
  return NextResponse.json({ ok: true, service: 'socialtool.store webhook', ts: Date.now() })
}

export async function POST(req: NextRequest) {
  // Log the incoming request so the merchant can see exactly what Wire.mn
  // sends during verification (helpful while setting up the webhook).
  const raw = await req.text()
  const sigHeaders = [
    'wire-signature', 'x-wire-signature', 'x-signature',
    'signature', 'x-hub-signature', 'wire-signature-timestamp',
  ]
  const foundSig = sigHeaders.find((h) => req.headers.get(h))
  console.log('[wire-webhook] incoming POST', {
    signature: foundSig ? `${foundSig}=${req.headers.get(foundSig)?.slice(0, 24)}…` : 'NONE',
    contentType: req.headers.get('content-type'),
    bodyPreview: raw.slice(0, 200),
  })

  try {
    // Determine the event type BEFORE signature verification — Wire.mn sends
    // a `ping` event during endpoint verification. We must return 2xx for it
    // even when no signature is present (some setups don't sign pings).
    let body: Record<string, unknown> = {}
    try { body = JSON.parse(raw) } catch { /* non-JSON body */ }
    const eventType: string = String(body.type || body.event_type || '').toLowerCase()

    // 1) Verification ping — always accept so the endpoint activates.
    if (eventType === 'ping' || eventType === 'endpoint.verify' || eventType === 'webhook.verify') {
      console.log('[wire-webhook] verification ping accepted → 200')
      return NextResponse.json({ ok: true, verified: true })
    }

    // 2) Real events require a valid signature.
    const signature =
      req.headers.get('wire-signature') ||
      req.headers.get('x-wire-signature') ||
      req.headers.get('x-signature') ||
      req.headers.get('signature') ||
      ''

    if (!verifyWebhookSignature(raw, signature)) {
      console.warn('[wire-webhook] signature verification FAILED', {
        hasSig: !!signature,
        hasSecret: !!(process.env.WIRE_MN_WEBHOOK_SECRET && process.env.WIRE_MN_WEBHOOK_SECRET !== 'whsec_replace_with_your_endpoint_signing_secret'),
        eventType,
      })
      return NextResponse.json({ error: 'Гарын үсэг буруу эсвэл webhook secret тохируулаагүй байна' }, { status: 401 })
    }

    const data = (body.data || body.object || body) as Record<string, unknown>
    const paymentIntentId: string | undefined = String(data.id || data.payment_intent || body.payment_intent_id || '')
    const transactionId: string | undefined = String(data.transaction_id || (data.latest_transaction as Record<string, unknown> | undefined)?.id || '')
    const status: string = String(data.status || '')

    if (!paymentIntentId) {
      console.warn('[wire-webhook] no payment_intent id in event', { eventType })
      return NextResponse.json({ error: 'payment_intent id олдсонгүй' }, { status: 400 })
    }

    // Find our payment by the Wire PaymentIntent id
    const payment = await db.payment.findFirst({
      where: { wirePaymentIntentId: paymentIntentId },
      include: { order: true },
    })
    if (!payment) {
      console.warn('[wire-webhook] payment not found for intent', { paymentIntentId })
      // Still return 200 so Wire doesn't retry forever — the event arrived
      // for an intent we don't track (could be a test ping from dashboard).
      return NextResponse.json({ ok: true, ignored: true })
    }

    const mapped = mapIntentStatus(status || (eventType.includes('succeeded') ? 'succeeded' : ''))
    const order = payment.order

    if (mapped === 'PAID' && payment.status !== 'PAID') {
      await db.$transaction([
        db.payment.update({
          where: { id: payment.id },
          data: {
            status: 'PAID',
            wireTransactionId: transactionId || payment.wireTransactionId,
            paidAt: new Date(),
          },
        }),
        db.order.update({
          where: { id: order.id },
          data: { status: 'PAID', paymentId: payment.id },
        }),
      ])
      console.log('[wire-webhook] order marked PAID', { orderNumber: order.orderNumber, paymentIntentId })

      const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/admin?order=${order.id}`
      sendTelegramMessage(
        formatPaymentConfirmedNotification({
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          total: order.totalAmount,
          adminUrl,
        })
      ).catch(() => {})
    } else if (mapped === 'FAILED' || mapped === 'EXPIRED') {
      await db.payment.update({
        where: { id: payment.id },
        data: { status: mapped },
      })
      console.log('[wire-webhook] payment marked', { mapped, paymentIntentId })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[wire-webhook] handler error:', e)
    // Return 500 so Wire retries, but we log full context above for debugging.
    return NextResponse.json({ error: 'Callback алдаа' }, { status: 500 })
  }
}
