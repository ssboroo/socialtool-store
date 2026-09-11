import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>
    const customerName = body.customerName
    const phone = body.phone
    if (typeof customerName !== 'string' || !customerName.trim() || customerName.trim().length > 120) {
      return NextResponse.json({ error: 'Нэр буруу байна' }, { status: 400 })
    }
    if (phone != null && phone !== '' && (typeof phone !== 'string' || phone.trim().length > 32)) {
      return NextResponse.json({ error: 'Утасны дугаар буруу байна' }, { status: 400 })
    }
    const session = await db.chatSession.create({
      data: {
        customerName: customerName.trim(),
        phone: typeof phone === 'string' ? phone.trim() || null : null,
      },
    })
    return NextResponse.json({ sessionId: session.id }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    if (e instanceof SyntaxError) return NextResponse.json({ error: 'Хүсэлтийн бүтэц буруу байна' }, { status: 400 })
    console.error('Chat session error:', e)
    return NextResponse.json({ error: 'Чат эхлүүлэхэд алдаа гарлаа' }, { status: 500 })
  }
}
