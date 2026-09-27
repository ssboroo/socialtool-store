import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Never report operational DB paths, secret values, or customer data publicly.
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const [tables, fields, customerFields, orderItemFields] = await Promise.all([
      db.$queryRawUnsafe<Array<{name:string}>>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('Product','Customer','Order','Wishlist','AnalyticsEvent')"
      ),
      db.$queryRawUnsafe<Array<{name:string}>>('PRAGMA table_info("Product")'),
      db.$queryRawUnsafe<Array<{name:string}>>('PRAGMA table_info("Customer")'),
      db.$queryRawUnsafe<Array<{name:string}>>('PRAGMA table_info("OrderItem")'),
    ])
    const names = new Set(tables.map(row => row.name))
    const product = new Set(fields.map(row => row.name))
    const customer = new Set(customerFields.map(row => row.name))
    const items = new Set(orderItemFields.map(row => row.name))
    const ready = ['Product', 'Customer', 'Order', 'Wishlist', 'AnalyticsEvent'].every(name => names.has(name)) &&
      ['searchKeywords', 'requiresOrderLink'].every(name => product.has(name)) &&
      ['cartItems', 'cartVersion'].every(name => customer.has(name)) &&
      items.has('orderLink')
    if (!ready) return NextResponse.json(
      { status: 'not_ready', reason: 'schema_migration_required' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    )
    return NextResponse.json({
      status: 'ok',
      revision: process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 12) || null,
      features: ['smart_search', 'ai_advisor', 'analytics', 'wishlist', 'product_health'],
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ status: 'not_ready', reason: 'database_unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
