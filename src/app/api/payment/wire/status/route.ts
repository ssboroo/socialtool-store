import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { retrievePaymentIntent, mapIntentStatus } from '@/lib/wire'
import { sendTelegramMessage, formatPaymentConfirmedNotification } from '@/lib/telegram'

/**
 * Payment status endpoint — the server-side source of truth.
 *
 *  1. Reads the current payment status from our DB (updated by the webhook).
 *  2. If still PENDING and we have a Wire PaymentIntent id, queries the Wire.mn
 *     API directly to confirm — this is the fallback path that works even
 *     before the merchant has configured the webhook signing secret.
 *  3. When the Wire.mn API says "succeeded", marks the order PAID server-side
 *     and fires the admin Telegram notification — never trusts the frontend.
 */
export async function GET(req: NextRequest) {
  const orderId = new URL(req.url).searchParams.get('orderId')
  if (!orderId) return NextResponse.json({ error: 'orderId шаардлагатай' }, { status: 400 })

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { payment: true },
  })
  if (!order) return NextResponse.json({ error: 'Олдсонгүй' }, { status: 404 })

  let status = (order.payment?.status || 'PENDING').toUpperCase()

  // Fallback: poll the Wire.mn API directly when still pending and we have a
  // PaymentIntent id. This confirms the payment server-side even if the webhook
  // isn't configured or hasn't fired yet.
  if (
    status === 'PENDING' &&
    order.payment?.wirePaymentIntentId &&
    order.payment.wirePaymentIntentId !== 'demo_'
  ) {
    try {
      const intent = await retrievePaymentIntent(order.payment.wirePaymentIntentId)
      const mapped = mapIntentStatus(intent.status)
      if (mapped === 'PAID') {
        await db.$transaction([
          db.payment.update({
            where: { id: order.payment.id },
            data: { status: 'PAID', paidAt: new Date() },
          }),
          db.order.update({
            where: { id: order.id },
            data: { status: 'PAID', paymentId: order.payment.id },
          }),
        ])
        status = 'PAID'
        const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/admin?order=${order.id}`
        await sendTelegramMessage(
          formatPaymentConfirmedNotification({
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            total: order.totalAmount,
            adminUrl,
          })
        ).catch(() => {})
      } else if (mapped === 'FAILED' || mapped === 'EXPIRED') {
        await db.payment.update({
          where: { id: order.payment.id },
          data: { status: mapped },
        })
        status = mapped
      }
    } catch (e) {
      // Wire API unreachable / not configured — keep PENDING, log the error.
      console.error('Wire status poll failed:', e)
    }
  }

  return NextResponse.json({
    status,
    orderStatus: order.status,
    orderNumber: order.orderNumber,
    amount: order.totalAmount,
  })
}
