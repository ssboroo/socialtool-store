import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { customerName, phone } = await req.json()
    if (!customerName?.trim()) {
      return NextResponse.json({ error: 'Нэр шаардлагатай' }, { status: 400 })
    }
    const session = await db.chatSession.create({
      data: { customerName: customerName.trim(), phone: phone?.trim() || null },
    })
    return NextResponse.json({ sessionId: session.id })
  } catch (e) {
    console.error('Chat session error:', e)
    return NextResponse.json({ error: 'Алдаа' }, { status: 500 })
  }
}
