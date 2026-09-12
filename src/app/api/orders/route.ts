import { validTerm, licenseOptions, licensePrice } from '@/lib/license'
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

function validText(value: unknown, max: number, min = 1): value is string {
  return typeof value === 'string' && value.trim().length >= min && value.trim().length <= max
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>
    const customerName = body.customerName
    const phone = body.phone
    const email = body.email
    const telegram = body.telegram
    const items = body.items

    if (!validText(customerName, 120) || !validText(phone, 32, 3) || !validText(email, 254)) {
      return NextResponse.json({ error: 'Нэр, утас эсвэл и-мэйл буруу байна' }, { status: 400 })
    }
    const normalizedEmail = email.toLowerCase().trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: 'И-мэйл хаяг буруу байна' }, { status: 400 })
    }
    if (telegram != null && telegram !== '' && !validText(telegram, 80)) {
      return NextResponse.json({ error: 'Telegram хаяг буруу байна' }, { status: 400 })
    }
    if (!Array.isArray(items) || items.length < 1 || items.length > 100 || items.some((item) => {
      if (!item || typeof item !== 'object') return true
      const i = item as Partial<OrderItemInput>
      return !validText(i.productId, 120)
        || typeof i.name !== 'string' || i.name.length > 200
        || !Number.isSafeInteger(i.price) || Number(i.price) <= 0
        || !Number.isSafeInteger(i.quantity) || Number(i.quantity) < 1 || Number(i.quantity) > 99
        || (i.duration != null && !validTerm(i.duration))
    })) {
      return NextResponse.json({ error: 'Захиалгын барааны мэдээлэл буруу байна' }, { status: 400 })
    }

    const typedItems = items as OrderItemInput[]
    const decoded = getCustomerFromRequest(req)
    const customerId = decoded?.sub || null

    const productIds = typedItems.map((i) => i.productId)
    const products = await db.product.findMany({ where: { id: { in: productIds } } })
    const productMap = new Map(products.map((p) => [p.id, p]))
    for (const item of typedItems) {
      const product = productMap.get(item.productId)
      if (!product || !product.available) {
        return NextResponse.json({ error: 'Сонгосон бүтээгдэхүүн олдсонгүй эсвэл түр дууссан байна' }, { status: 400 })
      }
      const allowed = licenseOptions(product.duration)
      if ((allowed.length && !allowed.includes(item.duration || '')) || (!allowed.length && item.duration)) {
        return NextResponse.json({ error: 'Барааны хугацааны сонголт өөрчлөгдсөн. Сагсаа шинэчилж дахин сонгоно уу.' }, { status: 400 })
      }
      if (licensePrice(product, item.duration || '') !== item.price) {
        return NextResponse.json({ error: 'Үнийн зөрүү байна. Сагсаа шинэчилж дахин оролдоно уу.' }, { status: 400 })
      }
    }

    const supplierRows = await db.supplierCatalogItem.findMany({
      where: { productId: { in: productIds }, published: true },
      orderBy: { updatedAt: 'desc' },
    })
    const supplierMap = new Map<string, (typeof supplierRows)[number]>()
    for (const row of supplierRows) {
      if (row.productId && !supplierMap.has(row.productId)) supplierMap.set(row.productId, row)
    }

    const total = typedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    if (!Number.isSafeInteger(total) || total <= 0) {
      return NextResponse.json({ error: 'Захиалгын нийт дүн буруу байна' }, { status: 400 })
    }
    const orderNumber = generateOrderNumber()

    const order = await db.order.create({
      data: {
        orderNumber,
        customerName: customerName.trim(),
        phone: phone.trim(),
        email: normalizedEmail,
        telegram: typeof telegram === 'string' ? telegram.trim() || null : null,
        totalAmount: total,
        status: 'PENDING_PAYMENT',
        customerId,
        items: {
          create: typedItems.map((item) => {
            const supplier = supplierMap.get(item.productId)
            return {
              productId: item.productId,
              productName: `${productMap.get(item.productId)!.name}${item.duration ? ` — ${item.duration}` : ''}`,
              price: item.price,
              quantity: item.quantity,
              supplierName: supplier?.supplier || null,
              supplierSourceUrl: supplier?.sourceUrl || null,
              supplierCost: supplier?.sourcePrice ?? null,
              supplierCurrency: supplier?.sourceCurrency || null,
            }
          }),
        },
      },
      include: { items: true },
    })

    const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/admin?order=${order.id}`
    await sendTelegramMessage(
      formatOrderNotification({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        phone: order.phone,
        email: order.email,
        telegram: order.telegram || undefined,
        items: order.items.map((item) => ({ name: item.productName, quantity: item.quantity, price: item.price })),
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
    if (e instanceof SyntaxError) return NextResponse.json({ error: 'Хүсэлтийн бүтэц буруу байна' }, { status: 400 })
    console.error('Order creation error:', e)
    return NextResponse.json({ error: 'Захиалга үүсгэхэд алдаа гарлаа' }, { status: 500 })
  }
}