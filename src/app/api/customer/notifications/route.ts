import { NextRequest, NextResponse } from 'next/server'
import { getCustomerFromRequest } from '@/lib/auth'
import { db } from '@/lib/db'
export async function GET(req: NextRequest) {
  const customer = getCustomerFromRequest(req)
  if (!customer) return NextResponse.json({ error: 'Нэвтэрнэ үү' }, { status: 401 })
  const orders = await db.order.findMany({ where: { customerId: customer.sub, chatSessionId: { not: null } }, select: { chatSessionId: true, orderNumber: true } })
  const sessions = orders.map(o => o.chatSessionId!).filter(Boolean)
  const messages = await db.chatMessage.findMany({ where: { sessionId: { in: sessions }, sender: { in: ['system','admin'] } }, orderBy: { createdAt: 'desc' }, take: 100 })
  return NextResponse.json({ notifications: messages.map(m => ({ id: m.id, sessionId: m.sessionId, content: m.content, createdAt: m.createdAt, readAt: m.customerReadAt, orderNumber: orders.find(o => o.chatSessionId === m.sessionId)?.orderNumber })) }, { headers: { 'Cache-Control': 'private, no-store' } })
}
export async function PATCH(req: NextRequest) {
  const customer = getCustomerFromRequest(req)
  if (!customer) return NextResponse.json({ error: 'Нэвтэрнэ үү' }, { status: 401 })
  const body = await req.json().catch(() => null)
  if (!Array.isArray(body?.ids) || body.ids.length > 100 || body.ids.some((id: unknown) => typeof id !== 'string')) return NextResponse.json({ error: 'Буруу хүсэлт' }, { status: 400 })
  const orders = await db.order.findMany({ where: { customerId: customer.sub, chatSessionId: { not: null } }, select: { chatSessionId: true } })
  await db.chatMessage.updateMany({ where: { id: { in: body.ids }, sessionId: { in: orders.map(o => o.chatSessionId!) }, customerReadAt: null }, data: { customerReadAt: new Date() } })
  return NextResponse.json({ ok: true })
}
