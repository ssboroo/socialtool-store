import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'
import { sendTelegramMessage, formatPaymentConfirmedNotification } from '@/lib/telegram'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })
  const { id } = await params
  const order = await db.order.findUnique({
    where: { id },
    include: { items: true, payment: true },
  })
  if (!order) return NextResponse.json({ error: 'Олдсонгүй' }, { status: 404 })
  return NextResponse.json(order)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    const { action } = body as { action?: string }

    const order = await db.order.findUnique({
      where: { id },
      include: { items: true, payment: true },
    })
    if (!order) return NextResponse.json({ error: 'Олдсонгүй' }, { status: 404 })

    if (action === 'mark_paid') {
      // Manual confirmation (admin override). For real payments the webhook does this.
      await db.$transaction([
        db.payment.update({
          where: { orderId: order.id },
          data: { status: 'PAID', paidAt: new Date() },
        }),
        db.order.update({ where: { id: order.id }, data: { status: 'PAID' } }),
      ])
      const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/admin?order=${order.id}`
      sendTelegramMessage(
        formatPaymentConfirmedNotification({
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          total: order.totalAmount,
          adminUrl,
        })
      ).catch(() => {})
      return NextResponse.json({ ok: true, status: 'PAID' })
    }

    if (action === 'mark_delivered') {
      const updated = await db.order.update({
        where: { id: order.id },
        data: { status: 'DELIVERED' },
      })
      return NextResponse.json({ ok: true, status: updated.status })
    }

    if (action === 'cancel') {
      const updated = await db.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
      })
      return NextResponse.json({ ok: true, status: updated.status })
    }

    if (action === 'set_status' && body.status) {
      const updated = await db.order.update({
        where: { id: order.id },
        data: { status: body.status },
      })
      return NextResponse.json({ ok: true, status: updated.status })
    }

    return NextResponse.json({ error: 'Үйлдэл олдсонгүй' }, { status: 400 })
  } catch (e) {
    console.error('Admin order update error:', e)
    return NextResponse.json({ error: 'Алдаа гарлаа' }, { status: 500 })
  }
}
