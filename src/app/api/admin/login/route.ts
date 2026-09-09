import { NextRequest, NextResponse } from 'next/server'
import { ensureDefaultAdmin, signAdminToken, verifyAdminCredentials } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()
    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
      return NextResponse.json({ error: 'Нэвтрэх нэр болон нууц үг шаардлагатай' }, { status: 400 })
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      return NextResponse.json({ error: 'Админ нэвтрэлт тохируулаагүй: серверт JWT_SECRET (32+ тэмдэгт) шаардлагатай.' }, { status: 503 })
    }
    await ensureDefaultAdmin()
    const user = await verifyAdminCredentials(username, password)
    if (!user) {
      return NextResponse.json({ error: 'Нэвтрэх нэр эсвэл нууц үг буруу' }, { status: 401 })
    }
    const token = signAdminToken(user)
    const res = NextResponse.json({ ok: true, token, username: user.username })
    res.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: req.nextUrl.protocol === 'https:',
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
