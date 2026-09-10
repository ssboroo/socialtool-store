import { validTerm } from '@/lib/license'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateOrderNumber } from '@/lib/format'
import { sendTelegramMessage, formatOrderNotification } from '@/lib/telegram'
import { getCustomerFromRequest } from '@/lib/auth'

interface OrderItemInput {
  duration?: string
  productId: string
  name: string
  price: number
  quantity: number
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { customerName, phone, email, telegram, items } = body as {
      customerName: string
      phone: string
      email: string
      telegram?: string | null
      items: OrderItemInput[]
    }

    if (!customerName || !phone || !email || !items?.length) {
      return NextResponse.json(
        { error: 'Шаардлагатай талбар дутуу байна' },
        { status: 400 }
      )
    }

    if (!Array.isArray(items) || items.length > 100 || items.some(i => !i || (i.duration != null && !validTerm(i.duration)) || !Number.isSafeInteger(i.quantity) || i.quantity < 1 || i.quantity > 99)) {
      return NextResponse.json({ error: 'Эрхийн хугацаа эсвэл тоо ширхэг буруу байна' }, { status: 400 })
    }

    // If the customer is logged in, link the order to their account.
    const decoded = getCustomerFromRequest(req)
    const customerId = decoded?.sub || null

    // verify products exist
    const productIds = items.map((i) => i.productId)
    const products = await db.product.findMany({ where: { id: { in: productIds } } })
    const productMap = new Map(products.map((p) => [p.id, p]))
    for (const it of items) {
      const p = productMap.get(it.productId)
      if (!p || !p.available) {
        return NextResponse.json({ error: `Хэрэгсэл олдсонгүй: ${it.name}` }, { status: 400 })
      }
      if (p.price !== it.price) {
        return NextResponse.json({ error: 'Үнийн зөрүү байна' }, { status: 400 })
      }
    }

    const total = items.reduce((s, i) => s + i.price * i.quantity, 0)
    const orderNumber = generateOrderNumber()

    const order = await db.order.create({
      data: {
        orderNumber,
        customerName: customerName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        telegram: telegram?.trim() || null,
        totalAmount: total,
        status: 'PENDING_PAYMENT',
        customerId,
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            productName: `${productMap.get(i.productId)!.name} — ${i.duration || 'Хугацаагүй'}`,
            price: i.price,
            quantity: i.quantity,
          })),
        },
      },
      include: { items: true },
    })

    // send Telegram notification (fire-and-forget)
    const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/admin?order=${order.id}`
    await sendTelegramMessage(
      formatOrderNotification({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        phone: order.phone,
        email: order.email,
        telegram: order.telegram || undefined,
        items: order.items.map((i) => ({ name: i.productName, quantity: i.quantity, price: i.price })),
        total: order.totalAmount,
        status: 'Төлбөр хүлээгдэж байна',
        adminUrl,
      })
    ).catch(() => {})

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: order.totalAmount,
    })
  } catch (e) {
    console.error('Order creation error:', e)
    return NextResponse.json({ error: 'Захиалга үүсгэхэд алдаа гарлаа' }, { status: 500 })
  }
}
