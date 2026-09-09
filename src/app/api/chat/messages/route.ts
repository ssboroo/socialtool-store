import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendTelegramMessage, formatChatNotification } from '@/lib/telegram'

export async function POST(req: NextRequest) {
  try {
    const { sessionId, sender, content } = (await req.json()) as {
      sessionId: string
      sender: string
      content: string
    }
    if (!sessionId || !sender || !content?.trim()) {
      return NextResponse.json({ error: 'Invalid' }, { status: 400 })
    }

    const session = await db.chatSession.findUnique({ where: { id: sessionId } })
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    const msg = await db.chatMessage.create({
      data: { sessionId, sender, content: content.trim() },
    })
    await db.chatSession.update({
      where: { id: sessionId },
      data: { lastMessageAt: new Date() },
    })

    // notify admin via Telegram on customer messages
    if (sender === 'customer') {
      const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/admin?chat=${sessionId}`
      sendTelegramMessage(
        formatChatNotification({
          customerName: session.customerName,
          phone: session.phone || undefined,
          message: content.trim(),
          adminUrl,
        })
      ).catch(() => {})
    }

    return NextResponse.json({ ok: true, id: msg.id })
  } catch (e) {
    console.error('Chat message error:', e)
    return NextResponse.json({ error: 'Алдаа' }, { status: 500 })
  }
}
