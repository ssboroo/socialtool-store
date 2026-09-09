import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })

  const sessions = await db.chatSession.findMany({
    orderBy: { lastMessageAt: 'desc' },
    take: 50,
  })
  return NextResponse.json(sessions)
}
