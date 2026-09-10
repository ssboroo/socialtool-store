import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { signCustomerToken, verifyCustomerCredentials } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password || password.length > 128) {
      return NextResponse.json({ error: 'И-мэйл болон нууц үг шаардлагатай' }, { status: 400 })
    }
    const customer = await verifyCustomerCredentials(email, password)
    if (!customer) {
      return NextResponse.json({ error: 'И-мэйл эсвэл нууц үг буруу' }, { status: 401 })
    }
    const token = signCustomerToken({ id: customer.id, email: customer.email, name: customer.name })
    const res = NextResponse.json({
      ok: true,
      customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone, telegram: customer.telegram },
    })
    res.cookies.set('customer_token', token, {
      httpOnly: true,
      secure: req.nextUrl.protocol === 'https:',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    return res
  } catch (e) {
    console.error('Customer login error:', e)
    return NextResponse.json({ error: 'Нэвтрэхэд алдаа гарлаа' }, { status: 500 })
  }
}
