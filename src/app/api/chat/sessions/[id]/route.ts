import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Public endpoint for the customer to poll their own session messages.
// The sessionId is an opaque cuid returned when the session was created.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await db.chatSession.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  })
  if (!session) return NextResponse.json({ error: 'Олдсонгүй' }, { status: 404 })
  return NextResponse.json({
    sessionId: session.id,
    customerName: session.customerName,
    messages: session.messages.map((m) => ({
      id: m.id,
      sender: m.sender,
      content: m.content,
      createdAt: m.createdAt,
    })),
  })
}
