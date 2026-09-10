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
    if (typeof orderId !== 'string' || !orderId) return NextResponse.json({ error: 'orderId шаардлагатай' }, { status: 400 })

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true, payment: true },
    })
    if (!order) return NextResponse.json({ error: 'Захиалга олдсонгүй' }, { status: 404 })

    if (order.payment?.status === 'PAID' || order.status === 'PAID') {
      return NextResponse.json({ error: 'Энэ захиалгын төлбөр төлөгдсөн байна', code: 'already_paid' }, { status: 409 })
    }

    if (!Number.isSafeInteger(order.totalAmount) || order.totalAmount <= 0 || !Number.isSafeInteger(order.totalAmount * 100)) return NextResponse.json({ error: 'Төлбөрийн дүн буруу байна' }, { status: 400 })

    const previousIntentId = order.payment?.wirePaymentIntentId
    let expired = false
    if (previousIntentId) {
      const current = await retrievePaymentIntent(previousIntentId)
      if (current.status === 'succeeded' || current.status === 'paid') {
        return NextResponse.json({ error: 'Төлбөр хийгдсэн байна. Төлбөрийн төлөв шалгах товчийг дарна уу.', code: 'already_paid' }, { status: 409 })
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
        return NextResponse.json({ error: 'Төлбөрийн үйлчилгээний тохиргоог шинэчлэх шаардлагатай. Админтай холбогдоно уу.' }, { status: 503 })
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
        // Repair payment rows left without an intent by a previous failed attempt.
        await db.payment.updateMany({
          where: { orderId: order.id, wirePaymentIntentId: null, status: { not: 'PAID' } },
          data: { wirePaymentIntentId: intentId, status: 'PENDING' },
        })
        const saved = await db.payment.findUniqueOrThrow({ where: { orderId: order.id } })
        if (saved.status === 'PAID') return NextResponse.json({ error: 'Төлбөр төлөгдсөн байна', code: 'already_paid' }, { status: 409 })
        intentId = saved.wirePaymentIntentId!
      }
    }

    // 2) Create the hosted checkout session
    const session = await createCheckoutSession({
      paymentIntentId: intentId,
      orderId: order.id,
      successUrl,
    })

    await db.payment.updateMany({
      where: { orderId: order.id, wirePaymentIntentId: intentId, status: { not: 'PAID' } },
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
      const configurationCodes = ['operator_configuration', 'operator_unknown', 'connector_required', 'settlement_account_required', 'dan_verification_required', 'operator_not_allowed', 'checkout_url_invalid']
      const error = e.status === 401 || configurationCodes.includes(e.code || '')
        ? 'Төлбөрийн үйлчилгээний тохиргоог шинэчлэх шаардлагатай. Админтай холбогдоно уу.'
        : e.message
      return NextResponse.json({ error, code: e.code, requestId: e.requestId }, { status: e.status === 409 ? 409 : e.status === 429 ? 429 : 503 })
    }
    if (e instanceof Error && ['TimeoutError', 'AbortError'].includes(e.name)) {
      return NextResponse.json({ error: 'Төлбөрийн системийн хариу удаж байна. Түр хүлээгээд дахин оролдоно уу.', code: 'upstream_timeout' }, { status: 504 })
    }
    if (e instanceof SyntaxError) return NextResponse.json({ error: 'Хүсэлтийн бүтэц буруу байна' }, { status: 400 })
    console.error('Payment creation failed', { type: e instanceof Error ? e.name : 'unknown' })
    return NextResponse.json({ error: 'Төлбөрийн нэхэмжлэл үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.' }, { status: 500 })
  }
}
