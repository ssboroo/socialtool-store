import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'
const DAY = 86400000
const mongolianDay = (value: Date) => new Date(value.getTime() + 8 * 3600000).toISOString().slice(0, 10)

export async function GET(req: NextRequest) {
  if (!getAdminFromRequest(req)) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })
  const value = new URL(req.url).searchParams.get('days')
  const days = value === '7' ? 7 : value === '90' ? 90 : 30
  const since = new Date(Date.now() - days * DAY)
  const [events, orders, favorites, products, eventCount] = await Promise.all([
    db.analyticsEvent.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: 'desc' }, take: 30000 }),
    db.order.findMany({
      where: { payment: { is: { status: 'PAID', paidAt: { gte: since } } } },
      include: { items: true, payment: { select: { paidAt: true, amount: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    db.wishlist.groupBy({ by: ['productId'], _count: { _all: true }, orderBy: { _count: { productId: 'desc' } }, take: 30 }),
    db.product.findMany({ select: { id: true, name: true, price: true, available: true } }),
    db.analyticsEvent.count({ where: { createdAt: { gte: since } } }),
  ])
  const names = new Map(products.map(row => [row.id, row.name]))
  const views = new Map<string, number>()
  const cartAdds = new Map<string, number>()
  const searches = new Map<string, number>()
  const dailyEvents = new Map<string, { views: number; carts: number; checkouts: number }>()
  let checkouts = 0
  for (const event of events) {
    const day = mongolianDay(event.createdAt)
    const d = dailyEvents.get(day) || { views: 0, carts: 0, checkouts: 0 }
    if (event.type === 'product_view' && event.productId) {
      views.set(event.productId, (views.get(event.productId) || 0) + 1)
      d.views++
    }
    if (event.type === 'cart_add' && event.productId) {
      cartAdds.set(event.productId, (cartAdds.get(event.productId) || 0) + 1)
      d.carts++
    }
    if (event.type === 'checkout_start') { checkouts++; d.checkouts++ }
    if (event.type === 'search' && event.query) {
      const query = event.query.toLocaleLowerCase().trim()
      searches.set(query, (searches.get(query) || 0) + 1)
    }
    dailyEvents.set(day, d)
  }
  const sales = new Map<string, { count: number; revenue: number }>()
  const dailyRevenue = new Map<string, { revenue: number; orders: number }>()
  let revenue = 0
  for (const order of orders) {
    const amount = order.payment?.amount || 0
    revenue += amount
    const day = mongolianDay(order.payment?.paidAt || order.createdAt)
    const row = dailyRevenue.get(day) || { revenue: 0, orders: 0 }
    row.revenue += amount; row.orders++
    dailyRevenue.set(day, row)
    for (const item of order.items) {
      const current = sales.get(item.productId) || { count: 0, revenue: 0 }
      current.count += item.quantity
      current.revenue += item.price * item.quantity
      sales.set(item.productId, current)
    }
  }
  const top = (map: Map<string, number>) => [...map.entries()]
    .map(([productId, count]) => ({ productId, name: names.get(productId) || 'Архивласан бүтээгдэхүүн', count }))
    .sort((a, b) => b.count - a.count).slice(0, 10)

  const daily = Array.from({ length: days }, (_, i) => {
    const date = mongolianDay(new Date(Date.now() - (days - i - 1) * DAY))
    const ev = dailyEvents.get(date)
    const rev = dailyRevenue.get(date)
    return { date, revenue: rev?.revenue || 0, paidOrders: rev?.orders || 0, views: ev?.views || 0, carts: ev?.carts || 0, checkouts: ev?.checkouts || 0 }
  })
  return NextResponse.json({
    periodDays: days,
    truncated: eventCount > events.length,
    metrics: {
      revenue,
      paidOrders: orders.length,
      averageOrderValue: orders.length ? Math.round(revenue / orders.length) : 0,
      productViews: events.filter(event => event.type === 'product_view').length,
      cartAdds: events.filter(event => event.type === 'cart_add').length,
      checkoutStarts: checkouts,
      uniqueSessions: new Set(events.map(event => event.sessionId)).size,
      currentWishlists: favorites.reduce((total, row) => total + row._count._all, 0),
    },
    daily,
    topViewed: top(views),
    topCarted: top(cartAdds),
    topSold: [...sales.entries()].map(([productId, data]) => ({ productId, name: names.get(productId) || 'Архивласан бүтээгдэхүүн', ...data })).sort((a, b) => b.count - a.count).slice(0, 10),
    topWished: favorites.map(row => ({ productId: row.productId, name: names.get(row.productId) || 'Архивласан бүтээгдэхүүн', count: row._count._all })).slice(0, 10),
    topSearches: [...searches.entries()].map(([query, count]) => ({ query, count })).sort((a, b) => b.count - a.count).slice(0, 10),
  }, { headers: { 'Cache-Control': 'private, no-store' } })
}
