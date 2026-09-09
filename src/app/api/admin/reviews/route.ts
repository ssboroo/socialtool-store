import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })
  const reviews = await db.review.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(reviews)
}

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })
  try {
    const body = await req.json()
    const { name, role, rating, content } = body
    if (!name?.trim() || !content?.trim()) return NextResponse.json({ error: 'Нэр болон агуулга шаардлагатай' }, { status: 400 })
    const review = await db.review.create({
      data: {
        name: name.trim(),
        role: role?.trim() || 'Хэрэглэгч',
        rating: Math.min(5, Math.max(1, Number(rating) || 5)),
        content: content.trim(),
      },
    })
    return NextResponse.json(review)
  } catch (e) {
    console.error('Admin review create error:', e)
    return NextResponse.json({ error: 'Алдаа гарлаа' }, { status: 500 })
  }
}
