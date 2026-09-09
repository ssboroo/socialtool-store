import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyWebhookSignature, mapIntentStatus } from '@/lib/wire'
import { sendTelegramMessage, formatPaymentConfirmedNotification } from '@/lib/telegram'

/** Signed payment callbacks and endpoint.verification pings from Wire.mn. */
export async function GET() {
  return NextResponse.json({ ok: true, service: 'socialtool.store webhook', ts: Date.now() })
}

export async function POST(req: NextRequest) {
  const raw = await req.text()
  const signature = req.headers.get('wirepayment-signature') || ''
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: 'Гарын үсэг буруу эсвэл webhook secret тохируулаагүй байна' }, { status: 401 })
  }
  try {
    const body = JSON.parse(raw) as Record<string, unknown>
    const eventType = String(body.type || body.event_type || '').toLowerCase()
    if (eventType === 'endpoint.verification') {
      return NextResponse.json({ ok: true, verified: true })
    }
    if (!['payment_intent.succeeded', 'payment_intent.failed', 'payment_intent.canceled', 'payment_intent.expired'].includes(eventType)) {
      return NextResponse.json({ ok: true, ignored: true })
    }
    const envelope = (body.data || body.object || body) as Record<string, unknown>
    const data = (typeof envelope.object === 'object' && envelope.object !== null ? envelope.object : envelope) as Record<string, unknown>
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

    const mapped = mapIntentStatus(status || eventType.slice('payment_intent.'.length))
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
      await sendTelegramMessage(
        formatPaymentConfirmedNotification({
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          total: order.totalAmount,
          adminUrl,
        })
      ).catch(() => {})
    } else if (payment.status !== 'PAID' && (mapped === 'FAILED' || mapped === 'EXPIRED')) {
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
