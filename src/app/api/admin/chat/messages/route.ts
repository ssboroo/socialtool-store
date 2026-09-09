import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })

  try {
    const { sessionId, content } = await req.json()
    if (!sessionId || !content?.trim()) {
      return NextResponse.json({ error: 'Invalid' }, { status: 400 })
    }
    const msg = await db.chatMessage.create({
      data: { sessionId, sender: 'admin', content: content.trim() },
    })
    await db.chatSession.update({
      where: { id: sessionId },
      data: { lastMessageAt: new Date() },
    })
    return NextResponse.json({ ok: true, id: msg.id })
  } catch (e) {
    console.error('Admin chat message error:', e)
    return NextResponse.json({ error: 'Алдаа' }, { status: 500 })
  }
}
