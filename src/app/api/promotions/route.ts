import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const now = new Date()
  // return the active promotion that is within its date window
  const promo = await db.promotion.findFirst({
    where: {
      active: true,
      startAt: { lte: now },
      endAt: { gte: now },
    },
    orderBy: { createdAt: 'desc' },
  })
  if (!promo) return NextResponse.json(null)
  return NextResponse.json({
    id: promo.id,
    title: promo.title,
    description: promo.description,
    badgeText: promo.badgeText,
    discountPercent: promo.discountPercent,
    endAt: promo.endAt,
  })
}
