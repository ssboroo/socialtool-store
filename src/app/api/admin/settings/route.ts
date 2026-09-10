import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })
  const settings = await db.siteSetting.findMany()
  const map: Record<string, string> = {}
  for (const s of settings) map[s.key] = s.value
  return NextResponse.json(map)
}

export async function PUT(req: NextRequest) {
  const admin = getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })
  try {
    const body = (await req.json()) as Record<string, string>
    const allowed = [
      'privacyPolicy', 'termsOfService', 'heroImage', 'heroImages', 'heroHeadline', 'heroSubtext', 'heroPrimaryCta', 'heroSecondaryCta',
      'promoTitle', 'promoDescription', 'promoCta', 'promoDiscountPercent',
      'contactEmail', 'contactTelegram',
      'footerDescription', 'footerCopyright',
    ]
    if ('heroImage' in body && (typeof body.heroImage !== 'string' || (body.heroImage !== '' && !/^\/uploads\/products\/[A-Za-z0-9_-]+\.webp$/.test(body.heroImage)))) {
      return NextResponse.json({ error: 'Постерын зургийг файл сонгох хэсгээс оруулна уу.' }, { status: 400 })
    }
    if ('heroImages' in body) {
      let images: unknown
      try { images = JSON.parse(body.heroImages) } catch { images = null }
      if (!Array.isArray(images) || images.length > 10 || images.some(v => typeof v !== 'string' || !/^\/uploads\/products\/[A-Za-z0-9_-]+\.webp$/.test(v))) return NextResponse.json({ error: 'Слайдын зураг буруу байна.' }, { status: 400 })
    }
    for (const key of allowed) {
      if (key in body) {
        await db.siteSetting.upsert({
          where: { key },
          create: { key, value: String(body[key]) },
          update: { value: String(body[key]) },
        })
      }
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Admin settings update error:', e)
    return NextResponse.json({ error: 'Алдаа гарлаа' }, { status: 500 })
  }
}
