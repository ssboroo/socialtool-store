import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCustomerFromRequest } from '@/lib/auth'

export async function PUT(req: NextRequest) {
  const decoded = getCustomerFromRequest(req)
  if (!decoded) return NextResponse.json({ error: 'Нэвтрэх шаардлагатай' }, { status: 401 })

  try {
    const body = await req.json()
    const data: { name?: string; phone?: string; telegram?: string | null } = {}
    if (body.name?.trim()) data.name = body.name.trim()
    if (body.phone?.trim()) data.phone = body.phone.trim()
    if ('telegram' in body) data.telegram = body.telegram?.trim() || null

    const updated = await db.customer.update({
      where: { id: decoded.sub },
      data,
    })
    return NextResponse.json({
      ok: true,
      customer: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        telegram: updated.telegram,
      },
    })
  } catch (e) {
    console.error('Profile update error:', e)
    return NextResponse.json({ error: 'Шинэчлэхэд алдаа гарлаа' }, { status: 500 })
  }
}
