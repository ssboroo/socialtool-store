import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCustomerFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function customerId(req: NextRequest) {
  return getCustomerFromRequest(req)?.sub || null
}

export async function GET(req: NextRequest) {
  const id = customerId(req)
  if (!id) return NextResponse.json({ error: 'Нэвтэрнэ үү' }, { status: 401 })
  const rows = await db.wishlist.findMany({
    where: { customerId: id },
    orderBy: { createdAt: 'desc' },
    include: { product: { select: {
      id: true, name: true, slug: true, shortDesc: true, description: true,
      image: true, icon: true, category: true, price: true, oldPrice: true, discount: true,
      available: true, featured: true, rating: true, reviewCount: true,
      duration: true, features: true, downloadUrl: true, requiresOrderLink: true,
    } } },
  })
  return NextResponse.json({ items: rows.map(row => ({
    id: row.id,
    savedPrice: row.savedPrice,
    createdAt: row.createdAt,
    priceDropped: row.product.price < row.savedPrice,
    product: row.product,
  })) }, { headers: { 'Cache-Control': 'private, no-store' } })
}

export async function POST(req: NextRequest) {
  const id = customerId(req)
  if (!id) return NextResponse.json({ error: 'Нэвтэрнэ үү' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const productId = body?.productId
  if (typeof productId !== 'string' || productId.length > 100) return NextResponse.json({ error: 'Бүтээгдэхүүн сонгоно уу' }, { status: 400 })
  const product = await db.product.findUnique({ where: { id: productId }, select: { id: true, price: true } })
  if (!product) return NextResponse.json({ error: 'Бүтээгдэхүүн олдсонгүй' }, { status: 404 })
  await db.wishlist.upsert({
    where: { customerId_productId: { customerId: id, productId } },
    create: { customerId: id, productId, savedPrice: product.price },
    update: {},
  })
  return NextResponse.json({ saved: true })
}

export async function DELETE(req: NextRequest) {
  const id = customerId(req)
  if (!id) return NextResponse.json({ error: 'Нэвтэрнэ үү' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const productId = body?.productId
  if (typeof productId !== 'string' || productId.length > 100) return NextResponse.json({ error: 'Бүтээгдэхүүн сонгоно уу' }, { status: 400 })
  await db.wishlist.deleteMany({ where: { customerId: id, productId } })
  return NextResponse.json({ saved: false })
}
