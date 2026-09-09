import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [todayOrders, pendingOrders, paidOrders, totalProducts, recentOrders, totalCustomers, activePromotions] = await Promise.all([
    db.order.count({ where: { createdAt: { gte: startOfDay } } }),
    db.order.count({ where: { status: 'PENDING_PAYMENT' } }),
    db.order.findMany({ where: { status: 'PAID' } }),
    db.product.count(),
    db.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    }),
    db.customer.count(),
    db.promotion.count({ where: { active: true, endAt: { gte: now } } }),
  ])

  const todayRevenue = (await db.order.findMany({
    where: { createdAt: { gte: startOfDay }, status: 'PAID' },
    select: { totalAmount: true },
  })).reduce((s, o) => s + o.totalAmount, 0)

  const totalRevenue = paidOrders.reduce((s, o) => s + o.totalAmount, 0)

  return NextResponse.json({
    todayOrders,
    todayRevenue,
    totalRevenue,
    pendingOrders,
    paidOrders: paidOrders.length,
    totalProducts,
    totalCustomers,
    activePromotions,
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      totalAmount: o.totalAmount,
      status: o.status,
      createdAt: o.createdAt,
      itemCount: o.items.length,
    })),
  })
}
