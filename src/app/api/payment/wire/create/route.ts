import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createPaymentIntent, createCheckoutSession, retrievePaymentIntent, WireApiError } from '@/lib/wire'

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

    const previousIntentId = order.payment?.wirePaymentIntentId
    let expired = false
    if (previousIntentId) {
      const current = await retrievePaymentIntent(previousIntentId)
      if (current.status === 'succeeded' || current.status === 'paid') {
        return NextResponse.json({ error: 'Төлбөр хийгдсэн байна. Төлбөрийн төлөв шалгах товчийг дарна уу.' }, { status: 409 })
      }
      expired = ['canceled', 'cancelled', 'expired', 'failed'].includes(current.status)
      if (!expired && order.payment?.wireCheckoutUrl) {
        return NextResponse.json({ payUrl: order.payment.wireCheckoutUrl, invoiceNumber: order.orderNumber, paymentIntentId: previousIntentId, demo: false })
      }
      if (!expired && current.status !== 'requires_payment_method') {
        return NextResponse.json({ error: 'Төлбөр боловсруулагдаж байна. Түр хүлээгээд төлөв шалгана уу.' }, { status: 409 })
      }
    }

    // Wire hosted checkout supports an omitted success URL and displays its own receipt.
    // Only use a trusted configured URL; never derive payment redirects from request headers.
    let successUrl: string | undefined
    const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
    if (configuredUrl) {
      try {
        const url = new URL(configuredUrl)
        if (url.protocol !== 'https:' || url.username || url.password) throw new Error('invalid URL')
        const redirect = new URL('/', url.origin)
        redirect.searchParams.set('payment', 'success')
        redirect.searchParams.set('order', order.id)
        successUrl = redirect.toString()
      } catch {
        return NextResponse.json({ error: 'NEXT_PUBLIC_SITE_URL буруу байна. https://socialtool.store гэж тохируулах эсвэл хоосон орхино уу.' }, { status: 503 })
      }
    }

    // Persist the intent before checkout creation so failed attempts can resume.
    let intentId = expired ? null : previousIntentId
    if (!intentId) {
      const intent = await createPaymentIntent({
        orderId: expired ? `${order.id}-after-${previousIntentId}` : order.id,
        amount: order.totalAmount,
        description: `SOCIALTOOL.STORE захиалга #${order.orderNumber}`,
      })
      intentId = intent.id
      if (expired) {
        const updated = await db.payment.updateMany({
          where: { orderId: order.id, wirePaymentIntentId: previousIntentId, status: { not: 'PAID' } },
          data: { wirePaymentIntentId: intentId, wireCheckoutSessionId: null, wireCheckoutUrl: null, status: 'PENDING' },
        })
        if (!updated.count) return NextResponse.json({ error: 'Төлбөрийн төлөв өөрчлөгдсөн. Дахин шалгана уу.' }, { status: 409 })
      } else {
        await db.payment.upsert({
          where: { orderId: order.id },
          create: { orderId: order.id, amount: order.totalAmount, invoiceNumber: order.orderNumber, method: 'WIRE', wirePaymentIntentId: intentId },
          update: {},
        })
      }
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
    if (e instanceof WireApiError) {
      return NextResponse.json({ error: e.message, code: e.code, requestId: e.requestId }, { status: e.status === 409 ? 409 : e.status === 429 ? 429 : 503 })
    }
    if (e instanceof Error && ['TimeoutError', 'AbortError'].includes(e.name)) {
      return NextResponse.json({ error: 'Wire хариу өгөх хугацаа хэтэрлээ. Дахин оролдоход ижил хүсэлтийн түлхүүр ашиглана.', code: 'upstream_timeout' }, { status: 504 })
    }
    const message = e instanceof Error ? e.message : 'Төлбөрийн сесс үүсгэхэд алдаа гарлаа'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
