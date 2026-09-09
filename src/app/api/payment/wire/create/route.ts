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

    if (order.payment?.status === 'PAID' || order.status === 'PAID') {
      return NextResponse.json({ error: 'Энэ захиалгын төлбөр төлөгдсөн байна' }, { status: 409 })
    }

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

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
    if (!siteUrl || !/^https?:\/\//.test(siteUrl)) {
      return NextResponse.json({ error: 'Төлбөрийн буцах хаяг тохируулаагүй байна. Админтай холбогдоно уу.' }, { status: 503 })
    }
    const successUrl = `${siteUrl}/?payment=success&order=${order.id}`

    // Persist the intent before checkout creation so failed attempts can resume.
    let intentId = order.payment?.wirePaymentIntentId
    if (!intentId) {
      const intent = await createPaymentIntent({
        orderId: order.id,
        amount: order.totalAmount,
        description: `SOCIALTOOL.STORE захиалга #${order.orderNumber}`,
      })
      intentId = intent.id
      await db.payment.upsert({
        where: { orderId: order.id },
        create: { orderId: order.id, amount: order.totalAmount, invoiceNumber: order.orderNumber, method: 'WIRE', wirePaymentIntentId: intentId },
        update: { wirePaymentIntentId: intentId },
      })
    }

    // 2) Create the hosted checkout session
    const session = await createCheckoutSession({
      paymentIntentId: intentId,
      orderId: order.id,
      successUrl,
    })

    await db.payment.update({
      where: { orderId: order.id },
      data: { wireCheckoutSessionId: session.id, wireCheckoutUrl: session.url },
    })

    return NextResponse.json({
      payUrl: session.url,
      invoiceNumber: order.orderNumber,
      paymentIntentId: intentId,
      demo: false,
    })
  } catch (e) {
    console.error('Wire checkout creation error:', e)
    const message = e instanceof Error ? e.message : 'Төлбөрийн сесс үүсгэхэд алдаа гарлаа'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
