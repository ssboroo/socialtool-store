import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { smartSearch } from '@/lib/smart-search'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const q = searchParams.get('q')?.trim()
  const sort = searchParams.get('sort') || 'featured'
  const featuredOnly = searchParams.get('featured') === '1'

  const where: {
    available?: boolean
    price?: number
    downloadUrl?: { not: null }
    featured?: boolean
    category?: string
  } = { available: true }

  if (featuredOnly) where.featured = true
  if (searchParams.get('free') === '1') { where.price = 0; where.downloadUrl = { not: null } }

  if (category && category !== 'all') {
    const cat = await db.category.findUnique({ where: { slug: category } })
    if (cat) where.category = cat.name
  }

  let orderBy: { featured?: 'desc'; rating?: 'desc'; price?: 'asc' | 'desc' }[] = [{ featured: 'desc' }, { rating: 'desc' }]
  if (sort === 'price-asc') orderBy = [{ price: 'asc' }]
  else if (sort === 'price-desc') orderBy = [{ price: 'desc' }]
  else if (sort === 'rating') orderBy = [{ rating: 'desc' }, { featured: 'desc' }]

  const candidates = await db.product.findMany({ where, orderBy })
  let products = q ? smartSearch(candidates, q, 100) : candidates
  if (q && sort === 'price-asc') products = [...products].sort((a,b)=>a.price-b.price)
  else if (q && sort === 'price-desc') products = [...products].sort((a,b)=>b.price-a.price)
  else if (q && sort === 'rating') products = [...products].sort((a,b)=>b.rating-a.rating)

  return NextResponse.json(
    products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      shortDesc: p.shortDesc,
      description: p.description,
      price: p.price,
      downloadUrl: p.downloadUrl,
      requiresOrderLink: p.requiresOrderLink,
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
