import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })

  const customers = await db.customer.findMany({
    orderBy: { createdAt: 'desc' },
    include: { orders: { select: { id: true, totalAmount: true, status: true } } },
    take: 200,
  })

  return NextResponse.json(
    customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      telegram: c.telegram,
      createdAt: c.createdAt,
      orderCount: c.orders.length,
      totalSpent: c.orders
        .filter((o) => o.status === 'PAID')
        .reduce((s, o) => s + o.totalAmount, 0),
    }))
  )
}
