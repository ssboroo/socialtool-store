import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCustomerFromRequest } from '@/lib/auth'
import { ORDER_STATUS_LABEL } from '@/lib/format'

export async function GET(req: NextRequest) {
  const decoded = getCustomerFromRequest(req)
  if (!decoded) return NextResponse.json({ error: 'Нэвтрэх шаардлагатай' }, { status: 401 })

  const orders = await db.order.findMany({
    where: { customerId: decoded.sub },
    include: { items: true, payment: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(
    orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      totalAmount: o.totalAmount,
      status: o.status,
      statusLabel: ORDER_STATUS_LABEL[o.status] || o.status,
      createdAt: o.createdAt,
      itemCount: o.items.length,
      items: o.items.map((i) => ({
        id: i.id,
        productName: i.productName,
        price: i.price,
        quantity: i.quantity,
      })),
      payment: o.payment
        ? { status: o.payment.status, invoiceNumber: o.payment.invoiceNumber, paidAt: o.payment.paidAt }
        : null,
    }))
  )
}
