import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  if (!getAdminFromRequest(req)) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })

  const orders = await db.order.findMany({
    where: { status: { in: ['PAID', 'DELIVERED'] } },
    include: { items: true, payment: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return NextResponse.json(
    orders
      .map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        phone: order.phone,
        email: order.email,
        telegram: order.telegram,
        status: order.status,
        paymentStatus: order.payment?.status || null,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        items: order.items
          .filter(item => Boolean(item.supplierName))
          .map(item => ({
            id: item.id,
            productName: item.productName,
            quantity: item.quantity,
            supplierName: item.supplierName,
            supplierSourceUrl: item.supplierSourceUrl,
            supplierCost: item.supplierCost,
            supplierCurrency: item.supplierCurrency,
            deliveryCode: item.deliveryCode,
            deliveryNote: item.deliveryNote,
            fulfilledAt: item.fulfilledAt,
          })),
      }))
      .filter(order => order.items.length > 0)
  )
}

export async function POST(req: NextRequest) {
  if (!getAdminFromRequest(req)) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })

  try {
    const body = await req.json() as Record<string, unknown>
    const action = typeof body.action === 'string' ? body.action : ''

    if (action === 'fulfill_item') {
      const itemId = typeof body.itemId === 'string' ? body.itemId : ''
      const code = typeof body.code === 'string' ? body.code.trim() : ''
      const note = typeof body.note === 'string' ? body.note.trim() : ''
      if (!itemId || !code || code.length > 5000 || note.length > 2000) {
        return NextResponse.json({ error: 'Item, code эсвэл note буруу байна' }, { status: 400 })
      }

      const item = await db.orderItem.findUnique({
        where: { id: itemId },
        include: { order: { include: { payment: true } } },
      })
      if (!item || !item.supplierName) return NextResponse.json({ error: 'Supplier item олдсонгүй' }, { status: 404 })
      const paid = item.order.payment?.status === 'PAID' || item.order.status === 'PAID' || item.order.status === 'DELIVERED'
      if (!paid) return NextResponse.json({ error: 'Төлбөр баталгаажаагүй байна' }, { status: 409 })

      await db.orderItem.update({
        where: { id: item.id },
        data: { deliveryCode: code, deliveryNote: note || null, fulfilledAt: new Date() },
      })

      const allItems = await db.orderItem.findMany({ where: { orderId: item.orderId } })
      const supplierItems = allItems.filter(row => row.supplierName)
      const autoDelivered = supplierItems.length === allItems.length && supplierItems.length > 0 && supplierItems.every(row => row.fulfilledAt || row.id === item.id)
      if (autoDelivered && item.order.status === 'PAID') {
        await db.order.update({ where: { id: item.orderId }, data: { status: 'DELIVERED' } })
      }

      return NextResponse.json({ ok: true, status: autoDelivered ? 'DELIVERED' : item.order.status })
    }

    if (action === 'mark_order_delivered') {
      const orderId = typeof body.orderId === 'string' ? body.orderId : ''
      if (!orderId) return NextResponse.json({ error: 'Order ID дутуу' }, { status: 400 })
      const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true, payment: true } })
      if (!order) return NextResponse.json({ error: 'Захиалга олдсонгүй' }, { status: 404 })
      const supplierItems = order.items.filter(item => item.supplierName)
      if (!supplierItems.length || supplierItems.some(item => !item.fulfilledAt)) {
        return NextResponse.json({ error: 'Supplier item бүрийн key/code-ийг эхлээд хүргэнэ үү' }, { status: 409 })
      }
      if (order.payment?.status !== 'PAID' && order.status !== 'PAID' && order.status !== 'DELIVERED') {
        return NextResponse.json({ error: 'Төлбөр баталгаажаагүй байна' }, { status: 409 })
      }
      await db.order.update({ where: { id: order.id }, data: { status: 'DELIVERED' } })
      return NextResponse.json({ ok: true, status: 'DELIVERED' })
    }

    return NextResponse.json({ error: 'Үйлдэл олдсонгүй' }, { status: 400 })
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Хүсэлтийн бүтэц буруу байна' }, { status: 400 })
    console.error('Supplier fulfillment error:', error)
    return NextResponse.json({ error: 'Хүргэлт шинэчлэхэд алдаа гарлаа' }, { status: 500 })
  }
}
