import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  return getAdminFromRequest(req)
    ? NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
    : NextResponse.json({ error: 'Нэвтрэх хугацаа дууссан байна' }, { status: 401 })
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_token', '', { httpOnly: true, maxAge: 0, path: '/', sameSite: 'lax' })
  return res
}
