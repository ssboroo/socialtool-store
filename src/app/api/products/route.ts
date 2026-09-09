import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const q = searchParams.get('q')?.trim()
  const sort = searchParams.get('sort') || 'featured'
  const featuredOnly = searchParams.get('featured') === '1'

  const where: {
    available?: boolean
    featured?: boolean
    category?: string
    OR?: { name?: { contains: string }; shortDesc?: { contains: string }; description?: { contains: string } }[]
  } = { available: true }

  if (featuredOnly) where.featured = true

  if (category && category !== 'all') {
    const cat = await db.category.findUnique({ where: { slug: category } })
    if (cat) where.category = cat.name
  }

  if (q) {
    where.OR = [
      { name: { contains: q } },
      { shortDesc: { contains: q } },
      { description: { contains: q } },
    ]
  }

  let orderBy: { featured?: 'desc'; rating?: 'desc'; price?: 'asc' | 'desc' }[] = [{ featured: 'desc' }, { rating: 'desc' }]
  if (sort === 'price-asc') orderBy = [{ price: 'asc' }]
  else if (sort === 'price-desc') orderBy = [{ price: 'desc' }]
  else if (sort === 'rating') orderBy = [{ rating: 'desc' }, { featured: 'desc' }]

  const products = await db.product.findMany({ where, orderBy })

  return NextResponse.json(
    products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      shortDesc: p.shortDesc,
      description: p.description,
      price: p.price,
      oldPrice: p.oldPrice,
      discount: p.discount,
      icon: p.icon,
      image: p.image,
      category: p.category,
      rating: p.rating,
      reviewCount: p.reviewCount,
      available: p.available,
      features: p.features,
      duration: p.duration,
      tutorialVideoUrl: p.tutorialVideoUrl,
      instructionImages: p.instructionImages,
    }))
  )
}
