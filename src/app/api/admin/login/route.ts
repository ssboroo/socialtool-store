import { NextRequest, NextResponse } from 'next/server'
import { ensureDefaultAdmin, signAdminToken, verifyAdminCredentials } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    await ensureDefaultAdmin()
    const { username, password } = await req.json()
    if (!username || !password) {
      return NextResponse.json({ error: 'Нэвтрэх нэр болон нууц үг шаардлагатай' }, { status: 400 })
    }
    const user = await verifyAdminCredentials(username, password)
    if (!user) {
      return NextResponse.json({ error: 'Нэвтрэх нэр эсвэл нууц үг буруу' }, { status: 401 })
    }
    const token = signAdminToken(user)
    const res = NextResponse.json({ ok: true, token, username: user.username })
    res.cookies.set('admin_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    return res
  } catch (e) {
    console.error('Admin login error:', e)
    return NextResponse.json({ error: 'Алдаа гарлаа' }, { status: 500 })
  }
}
