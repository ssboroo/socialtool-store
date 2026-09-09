import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    const data: Record<string, unknown> = {}
    for (const k of ['name', 'shortDesc', 'description', 'icon', 'image', 'category', 'categoryId', 'features', 'duration', 'tutorialVideoUrl', 'instructionImages']) {
      if (k in body) data[k] = body[k] || null
    }
    if ('price' in body) data.price = Number(body.price)
    if ('oldPrice' in body) {
      const op = body.oldPrice ? Number(body.oldPrice) : null
      data.oldPrice = op
      data.discount = op && body.price ? Math.round(((op - Number(body.price)) / op) * 100) : null
    }
    if ('featured' in body) data.featured = !!body.featured
    if ('available' in body) data.available = !!body.available

    const product = await db.product.update({ where: { id }, data })
    return NextResponse.json(product)
  } catch (e) {
    console.error('Admin product update error:', e)
    return NextResponse.json({ error: 'Алдаа гарлаа' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })

  try {
    const { id } = await params
    await db.product.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Admin product delete error:', e)
    return NextResponse.json({ error: 'Алдаа гарлаа' }, { status: 500 })
  }
}
