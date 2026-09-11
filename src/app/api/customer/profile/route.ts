import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCustomerFromRequest } from '@/lib/auth'

export async function PUT(req: NextRequest) {
  const decoded = getCustomerFromRequest(req)
  if (!decoded) return NextResponse.json({ error: 'Нэвтрэх шаардлагатай' }, { status: 401 })

  try {
    const body = await req.json() as Record<string, unknown>
    const data: { name?: string; phone?: string; telegram?: string | null } = {}

    if ('name' in body) {
      if (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 120) {
        return NextResponse.json({ error: 'Нэр буруу эсвэл хэт урт байна' }, { status: 400 })
      }
      data.name = body.name.trim()
    }
    if ('phone' in body) {
      if (typeof body.phone !== 'string' || body.phone.trim().length < 3 || body.phone.trim().length > 32) {
        return NextResponse.json({ error: 'Утасны дугаар буруу байна' }, { status: 400 })
      }
      data.phone = body.phone.trim()
    }
    if ('telegram' in body) {
      if (body.telegram != null && body.telegram !== '' && (typeof body.telegram !== 'string' || body.telegram.trim().length > 80)) {
        return NextResponse.json({ error: 'Telegram хаяг буруу байна' }, { status: 400 })
      }
      data.telegram = typeof body.telegram === 'string' ? body.telegram.trim() || null : null
    }
    if (!Object.keys(data).length) {
      return NextResponse.json({ error: 'Шинэчлэх мэдээлэл алга' }, { status: 400 })
    }

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
    if (e instanceof SyntaxError) return NextResponse.json({ error: 'Хүсэлтийн бүтэц буруу байна' }, { status: 400 })
    console.error('Profile update error:', e)
    return NextResponse.json({ error: 'Шинэчлэхэд алдаа гарлаа' }, { status: 500 })
  }
}
