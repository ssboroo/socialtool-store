import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rankProducts } from '@/lib/smart-search'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get('q')?.trim().slice(0, 100) || ''
  const rows = await db.product.findMany({
    where: { available: true },
    select: {
      id: true, name: true, price: true, icon: true,
      image: true, category: true, shortDesc: true, searchKeywords: true, featured: true,
    },
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
  })
  const products = q.length >= 2 ? rankProducts(rows, q, 6) : rows.slice(0, 6)
  return NextResponse.json(
    { suggestions: products.map(({ id, name, price, icon, image, category }) => ({ id, name, price, icon, image, category })) },
    { headers: { 'Cache-Control': 'public, max-age=30' } },
  )
}
