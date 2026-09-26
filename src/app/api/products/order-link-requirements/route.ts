import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const raw = new URL(req.url).searchParams.get('ids') || ''
  const ids = [...new Set(raw.split(',').map(id => id.trim()).filter(Boolean))]
  if (!ids.length || ids.length > 100 || ids.some(id => id.length > 120)) {
    return NextResponse.json({ error: 'Бүтээгдэхүүний жагсаалт буруу байна' }, { status: 400 })
  }
  const products = await db.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, requiresOrderLink: true },
  })
  return NextResponse.json(
    { requirements: Object.fromEntries(products.map(p => [p.id, p.requiresOrderLink])) },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
