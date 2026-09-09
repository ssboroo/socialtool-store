import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'
import { sendTelegramMessage, formatPaymentConfirmedNotification } from '@/lib/telegram'

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const where: { status?: string } = {}
  if (status && status !== 'all') where.status = status

  const orders = await db.order.findMany({
    where,
    include: { items: true, payment: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(orders)
}
