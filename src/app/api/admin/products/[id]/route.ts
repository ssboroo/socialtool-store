import { validLicenseConfig } from '@/lib/license'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

function optionalText(value: unknown, max: number): string | null | undefined {
  if (value === undefined) return undefined
  if (value == null || value === '') return null
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length <= max ? trimmed : undefined
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })

  try {
    const { id } = await params
    const current = await db.product.findUnique({ where: { id } })
    if (!current) return NextResponse.json({ error: 'Бүтээгдэхүүн олдсонгүй' }, { status: 404 })

    const body = await req.json() as Record<string, unknown>
    if ('duration' in body && !validLicenseConfig(body.duration)) {
      return NextResponse.json({ error: 'Хугацааны тохиргоо буруу байна' }, { status: 400 })
    }

    const effectivePrice = 'price' in body ? Number(body.price) : current.price
    if (!Number.isSafeInteger(effectivePrice) || effectivePrice <= 0) {
      return NextResponse.json({ error: 'Үнийг зөв бүхэл тоогоор оруулна уу' }, { status: 400 })
    }
    const effectiveOldPrice = 'oldPrice' in body
      ? (body.oldPrice == null || body.oldPrice === '' ? null : Number(body.oldPrice))
      : current.oldPrice
    if (effectiveOldPrice !== null && (!Number.isSafeInteger(effectiveOldPrice) || effectiveOldPrice <= effectivePrice)) {
      return NextResponse.json({ error: 'Хуучин үнэ нь одоогийн үнээс их бүхэл тоо байх ёстой' }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    if ('name' in body) {
      if (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 160) return NextResponse.json({ error: 'Бүтээгдэхүүний нэр буруу байна' }, { status: 400 })
      data.name = body.name.trim()
    }
    if ('shortDesc' in body) {
      if (typeof body.shortDesc !== 'string' || body.shortDesc.length > 500) return NextResponse.json({ error: 'Товч тайлбар хэт урт байна' }, { status: 400 })
      data.shortDesc = body.shortDesc.trim()
    }
    if ('description' in body) {
      if (typeof body.description !== 'string' || body.description.length > 20000) return NextResponse.json({ error: 'Тайлбар хэт урт байна' }, { status: 400 })
      data.description = body.description
    }
    if ('icon' in body) {
      if (typeof body.icon !== 'string' || body.icon.length > 80) return NextResponse.json({ error: 'Icon буруу байна' }, { status: 400 })
      data.icon = body.icon.trim() || 'Package'
    }

    for (const [key, max] of [['image', 1000], ['features', 5000], ['tutorialVideoUrl', 1000], ['instructionImages', 10000]] as const) {
      if (!(key in body)) continue
      const value = optionalText(body[key], max)
      if (value === undefined) return NextResponse.json({ error: `${key} талбар буруу байна` }, { status: 400 })
      data[key] = value
    }
    if ('duration' in body) data.duration = typeof body.duration === 'string' && body.duration ? body.duration : null

    const effectiveCategoryId = 'categoryId' in body ? (typeof body.categoryId === 'string' ? body.categoryId.trim() : '') : current.categoryId
    const effectiveCategory = 'category' in body ? (typeof body.category === 'string' ? body.category.trim() : '') : current.category
    if (!effectiveCategoryId || !effectiveCategory || effectiveCategory.length > 100) {
      return NextResponse.json({ error: 'Ангиллын мэдээлэл буруу байна' }, { status: 400 })
    }
    if ('category' in body || 'categoryId' in body) {
      const categoryRow = await db.category.findUnique({ where: { id: effectiveCategoryId }, select: { name: true } })
      if (!categoryRow || categoryRow.name !== effectiveCategory) {
        return NextResponse.json({ error: 'Ангиллын мэдээлэл зөрүүтэй байна' }, { status: 400 })
      }
      data.category = effectiveCategory
      data.categoryId = effectiveCategoryId
    }

    if ('price' in body) data.price = effectivePrice
    if ('oldPrice' in body) data.oldPrice = effectiveOldPrice
    if ('price' in body || 'oldPrice' in body) {
      data.discount = effectiveOldPrice ? Math.round(((effectiveOldPrice - effectivePrice) / effectiveOldPrice) * 100) : null
    }
    if ('featured' in body) data.featured = body.featured === true
    if ('available' in body) data.available = body.available === true

    const product = await db.product.update({ where: { id }, data })
    return NextResponse.json(product)
  } catch (e) {
    if (e instanceof SyntaxError) return NextResponse.json({ error: 'Хүсэлтийн бүтэц буруу байна' }, { status: 400 })
    console.error('Admin product update error:', e)
    return NextResponse.json({ error: 'Бүтээгдэхүүн шинэчлэхэд алдаа гарлаа' }, { status: 500 })
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
    if (e && typeof e === 'object' && 'code' in e) {
      if (e.code === 'P2025') return NextResponse.json({ error: 'Бүтээгдэхүүн олдсонгүй' }, { status: 404 })
      if (e.code === 'P2003') return NextResponse.json({ error: 'Энэ бүтээгдэхүүн захиалгад ашиглагдсан тул устгах боломжгүй. Түр дууссан төлөвт оруулна уу.' }, { status: 409 })
    }
    console.error('Admin product delete error:', e)
    return NextResponse.json({ error: 'Бүтээгдэхүүн устгахад алдаа гарлаа' }, { status: 500 })
  }
}
