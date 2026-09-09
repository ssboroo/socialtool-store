import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })
  try {
    const { id } = await params
    const body = await req.json()
    const data: Record<string, unknown> = {}
    if (body.title !== undefined) data.title = body.title.trim()
    if (body.description !== undefined) data.description = body.description.trim()
    if (body.badgeText !== undefined) data.badgeText = body.badgeText.trim()
    if (body.discountPercent !== undefined) data.discountPercent = Math.min(90, Math.max(0, Number(body.discountPercent)))
    if (body.active !== undefined) data.active = !!body.active
    if (body.startAt !== undefined) data.startAt = new Date(body.startAt)
    if (body.endAt !== undefined) data.endAt = new Date(body.endAt)
    const promo = await db.promotion.update({ where: { id }, data })
    return NextResponse.json(promo)
  } catch (e) {
    console.error('Admin promotion update error:', e)
    return NextResponse.json({ error: 'Алдаа гарлаа' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })
  try {
    const { id } = await params
    await db.promotion.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Admin promotion delete error:', e)
    return NextResponse.json({ error: 'Алдаа гарлаа' }, { status: 500 })
  }
}
