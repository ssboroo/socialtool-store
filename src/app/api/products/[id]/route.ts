import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await db.product.findUnique({ where: { id } })
  if (!product) return NextResponse.json({ error: 'Олдсонгүй' }, { status: 404 })
  return NextResponse.json({
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDesc: product.shortDesc,
    description: product.description,
    price: product.price,
    oldPrice: product.oldPrice,
    discount: product.discount,
    icon: product.icon,
    image: product.image,
    category: product.category,
    rating: product.rating,
    reviewCount: product.reviewCount,
    available: product.available,
    features: product.features,
    duration: product.duration,
    tutorialVideoUrl: product.tutorialVideoUrl,
    instructionImages: product.instructionImages,
  })
}
