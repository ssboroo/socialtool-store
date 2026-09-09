import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createPaymentIntent, createCheckoutSession } from '@/lib/wire'

/**
 * Create a Wire.mn PaymentIntent + hosted checkout session for an order.
 * Returns the hosted pay URL (pay.wire.mn/...) the customer is redirected to.
 */
export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json()
    if (!orderId) return NextResponse.json({ error: 'orderId шаардлагатай' }, { status: 400 })

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true, payment: true },
    })
    if (!order) return NextResponse.json({ error: 'Захиалга олдсонгүй' }, { status: 404 })

    // If a payment + checkout URL already exists for this order, return it
    // (avoid creating duplicate PaymentIntents on retry).
    if (order.payment?.wireCheckoutUrl) {
      return NextResponse.json({
        payUrl: order.payment.wireCheckoutUrl,
        invoiceNumber: order.payment.invoiceNumber || order.orderNumber,
        paymentIntentId: order.payment.wirePaymentIntentId,
        demo: false,
      })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
    const successUrl = `${siteUrl}/?payment=success&order=${order.id}`

    // 1) Create the PaymentIntent
    const intent = await createPaymentIntent({
      orderId: order.id,
      amount: order.totalAmount,
      description: `SOCIALTOOL.STORE захиалга #${order.orderNumber}`,
    })

    // 2) Create the hosted checkout session
    const session = await createCheckoutSession({
      paymentIntentId: intent.id,
      orderId: order.id,
      successUrl,
    })

    // 3) Persist payment record with Wire IDs + hosted URL
    if (order.payment) {
      await db.payment.update({
        where: { orderId: order.id },
        data: {
          invoiceNumber: order.orderNumber,
          amount: order.totalAmount,
          status: 'PENDING',
          method: 'WIRE',
          wirePaymentIntentId: intent.id,
          wireCheckoutSessionId: session.id,
          wireCheckoutUrl: session.url,
        },
      })
    } else {
      await db.payment.create({
        data: {
          orderId: order.id,
          invoiceNumber: order.orderNumber,
          amount: order.totalAmount,
          status: 'PENDING',
          method: 'WIRE',
          wirePaymentIntentId: intent.id,
          wireCheckoutSessionId: session.id,
          wireCheckoutUrl: session.url,
        },
      })
    }

    return NextResponse.json({
      payUrl: session.url,
      invoiceNumber: order.orderNumber,
      paymentIntentId: intent.id,
      demo: false,
    })
  } catch (e) {
    console.error('Wire checkout creation error:', e)
    const message = e instanceof Error ? e.message : 'Төлбөрийн сесс үүсгэхэд алдаа гарлаа'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
