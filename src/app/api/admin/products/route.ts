import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

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
    const body = await req.json()
    const { name, shortDesc, description, price, oldPrice, icon, image, category, categoryId, featured, available, features, duration, tutorialVideoUrl, instructionImages } = body
    if (!name || !price || !category || !categoryId) {
      return NextResponse.json({ error: 'Шаардлагатай талбар дутуу' }, { status: 400 })
    }
    const slug = name.toLowerCase().replace(/[^\w\u0400-\u04FF]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) + '-' + Date.now().toString(36)
    const product = await db.product.create({
      data: {
        name,
        slug,
        shortDesc: shortDesc || '',
        description: description || '',
        price: Number(price),
        oldPrice: oldPrice ? Number(oldPrice) : null,
        discount: oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : null,
        icon: icon || 'Package',
        image: image || null,
        category,
        categoryId,
        featured: !!featured,
        available: available !== false,
        features: features || null,
        duration: duration || null,
        tutorialVideoUrl: tutorialVideoUrl || null,
        instructionImages: instructionImages || null,
        rating: 5,
        reviewCount: 0,
      },
    })
    return NextResponse.json(product)
  } catch (e) {
    console.error('Admin product create error:', e)
    return NextResponse.json({ error: 'Алдаа гарлаа' }, { status: 500 })
  }
}
