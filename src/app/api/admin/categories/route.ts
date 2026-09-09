import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })
  const categories = await db.category.findMany({ orderBy: { order: 'asc' } })
  return NextResponse.json(categories)
}

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })
  try {
    const body = await req.json()
    const { name, slug, icon, description, order } = body
    if (!name?.trim()) return NextResponse.json({ error: 'Нэр шаардлагатай' }, { status: 400 })
    const finalSlug = (slug?.trim() || name.toLowerCase().replace(/[^\w\u0400-\u04FF]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80))
    try {
      const cat = await db.category.create({
        data: {
          name: name.trim(),
          slug: finalSlug,
          icon: icon || 'Package',
          description: description || null,
          order: Number(order) || 0,
        },
      })
      return NextResponse.json(cat)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Алдаа'
      if (msg.includes('Unique')) return NextResponse.json({ error: 'Энэ slug-аар ангилал байна' }, { status: 409 })
      throw e
    }
  } catch (e) {
    console.error('Admin category create error:', e)
    return NextResponse.json({ error: 'Алдаа гарлаа' }, { status: 500 })
  }
}
