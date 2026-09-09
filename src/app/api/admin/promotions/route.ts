import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })
  const promotions = await db.promotion.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(promotions)
}

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })
  try {
    const body = await req.json()
    const { title, description, badgeText, discountPercent, active, endAt, startAt } = body
    if (!title?.trim()) return NextResponse.json({ error: 'Гарчиг шаардлагатай' }, { status: 400 })
    if (!endAt) return NextResponse.json({ error: 'Дуусах хугацаа шаардлагатай' }, { status: 400 })
    const promo = await db.promotion.create({
      data: {
        title: title.trim(),
        description: description?.trim() || '',
        badgeText: badgeText?.trim() || 'Хямдрал',
        discountPercent: Math.min(90, Math.max(0, Number(discountPercent) || 0)),
        active: active !== false,
        startAt: startAt ? new Date(startAt) : new Date(),
        endAt: new Date(endAt),
      },
    })
    return NextResponse.json(promo)
  } catch (e) {
    console.error('Admin promotion create error:', e)
    return NextResponse.json({ error: 'Алдаа гарлаа' }, { status: 500 })
  }
}
