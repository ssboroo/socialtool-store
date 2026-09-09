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
    if (body.name !== undefined) data.name = body.name.trim()
    if (body.slug !== undefined) data.slug = body.slug.trim()
    if (body.icon !== undefined) data.icon = body.icon
    if (body.description !== undefined) data.description = body.description || null
    if (body.order !== undefined) data.order = Number(body.order)
    const cat = await db.category.update({ where: { id }, data })
    return NextResponse.json(cat)
  } catch (e) {
    console.error('Admin category update error:', e)
    return NextResponse.json({ error: 'Алдаа гарлаа' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })
  try {
    const { id } = await params
    const productsCount = await db.product.count({ where: { categoryId: id } })
    if (productsCount > 0) {
      return NextResponse.json({ error: `Энэ ангилалд ${productsCount} бүтээгдэхүүн байгаа тул устгах боломжгүй` }, { status: 400 })
    }
    await db.category.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Admin category delete error:', e)
    return NextResponse.json({ error: 'Алдаа гарлаа' }, { status: 500 })
  }
}
