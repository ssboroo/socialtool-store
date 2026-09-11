import { validLicenseConfig } from '@/lib/license'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

function text(value: unknown, max: number, required = false): string | null {
  if (value == null || value === '') return required ? null : ''
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if ((required && !trimmed) || trimmed.length > max) return null
  return trimmed
}

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const q = searchParams.get('q')?.trim()

  const where: {
    category?: string
    OR?: { name?: { contains: string }; shortDesc?: { contains: string }; description?: { contains: string } }[]
  } = {}
  if (category && category !== 'all') where.category = category
  if (q) {
    where.OR = [{ name: { contains: q } }, { shortDesc: { contains: q } }, { description: { contains: q } }]
  }

  const products = await db.product.findMany({
    where,
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
  })
  return NextResponse.json(products)
}

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })

  try {
    const body = await req.json() as Record<string, unknown>
    const name = text(body.name, 160, true)
    const category = text(body.category, 100, true)
    const categoryId = text(body.categoryId, 120, true)
    const shortDesc = text(body.shortDesc, 500) ?? null
    const description = text(body.description, 20000) ?? null
    const icon = text(body.icon, 80) ?? null
    const image = text(body.image, 1000) ?? null
    const features = text(body.features, 5000) ?? null
    const duration = body.duration == null || body.duration === '' ? null : body.duration
    const tutorialVideoUrl = text(body.tutorialVideoUrl, 1000) ?? null
    const instructionImages = text(body.instructionImages, 10000) ?? null
    const price = Number(body.price)
    const oldPrice = body.oldPrice == null || body.oldPrice === '' ? null : Number(body.oldPrice)

    if (!name || !category || !categoryId || shortDesc === null || description === null || icon === null || image === null || features === null || tutorialVideoUrl === null || instructionImages === null) {
      return NextResponse.json({ error: 'Бүтээгдэхүүний мэдээлэл буруу эсвэл хэт урт байна' }, { status: 400 })
    }
    if (!validLicenseConfig(duration) || !Number.isSafeInteger(price) || price <= 0) {
      return NextResponse.json({ error: 'Хугацаа болон үнийг зөв оруулна уу.' }, { status: 400 })
    }
    if (oldPrice !== null && (!Number.isSafeInteger(oldPrice) || oldPrice <= price)) {
      return NextResponse.json({ error: 'Хуучин үнэ нь одоогийн үнээс их бүхэл тоо байх ёстой' }, { status: 400 })
    }
    const categoryRow = await db.category.findUnique({ where: { id: categoryId }, select: { name: true } })
    if (!categoryRow || categoryRow.name !== category) {
      return NextResponse.json({ error: 'Ангиллын мэдээлэл зөрүүтэй байна' }, { status: 400 })
    }

    const slugBase = name.toLowerCase().replace(/[^\w\u0400-\u04FF]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'product'
    const product = await db.product.create({
      data: {
        name,
        slug: `${slugBase}-${Date.now().toString(36)}`,
        shortDesc,
        description,
        price,
        oldPrice,
        discount: oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : null,
        icon: icon || 'Package',
        image: image || null,
        category,
        categoryId,
        featured: body.featured === true,
        available: body.available !== false,
        features: features || null,
        duration: typeof duration === 'string' ? duration : null,
        tutorialVideoUrl: tutorialVideoUrl || null,
        instructionImages: instructionImages || null,
        rating: 5,
        reviewCount: 0,
      },
    })
    return NextResponse.json(product)
  } catch (e) {
    if (e instanceof SyntaxError) return NextResponse.json({ error: 'Хүсэлтийн бүтэц буруу байна' }, { status: 400 })
    console.error('Admin product create error:', e)
    return NextResponse.json({ error: 'Бүтээгдэхүүн үүсгэхэд алдаа гарлаа' }, { status: 500 })
  }
}
