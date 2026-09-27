import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
const TYPES = new Set(['product_view', 'cart_add', 'checkout_start', 'search'])
const SESSION = /^[a-f0-9]{8}-[a-f0-9-]{27,40}$/i
const recent = new Map<string, { count: number; expires: number }>()

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json() as Record<string, unknown>
    const type = payload.type
    const sessionId = payload.sessionId
    if (typeof type !== 'string' || !TYPES.has(type) ||
        typeof sessionId !== 'string' || !SESSION.test(sessionId)) {
      return NextResponse.json({ error: 'Үйлдлийн мэдээлэл буруу байна' }, { status: 400 })
    }
    if (recent.size > 15000) recent.clear()
    const now = Date.now()
    const limit = recent.get(sessionId)
    if (limit && limit.expires > now && limit.count >= 100) {
      return NextResponse.json({ error: 'Түр хүлээнэ үү' }, { status: 429 })
    }
    recent.set(sessionId, { count: limit && limit.expires > now ? limit.count + 1 : 1, expires: now + 600000 })

    const productId = typeof payload.productId === 'string' && payload.productId.length <= 100 ? payload.productId : null
    if ((type === 'product_view' || type === 'cart_add') && !productId) return NextResponse.json({ error: 'Бүтээгдэхүүн олдсонгүй' }, { status: 400 })
    if (productId && !(await db.product.findUnique({ where: { id: productId }, select: { id: true } }))) {
      return NextResponse.json({ error: 'Бүтээгдэхүүн олдсонгүй' }, { status: 404 })
    }

    const rawQuery = typeof payload.query === 'string' ? payload.query.trim().slice(0, 80) : ''
    // Don't retain an email address or phone number entered in a search field.
    const query = type === 'search' && rawQuery.length >= 2 && !/@|\b\d{7,}\b/.test(rawQuery) ? rawQuery : null
    if (type === 'search' && !query) return NextResponse.json({ ok: true })

    if (type === 'product_view') {
      const prior = await db.analyticsEvent.findFirst({
        where: { type, sessionId, productId, createdAt: { gte: new Date(now - 30 * 60000) } },
        select: { id: true },
      })
      if (prior) return NextResponse.json({ ok: true })
    }
    await db.analyticsEvent.create({ data: { type, sessionId, productId, query } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Бүртгэх боломжгүй байна' }, { status: 400 })
  }
}
