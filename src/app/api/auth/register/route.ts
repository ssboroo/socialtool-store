import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { signCustomerToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { name, phone, email, password, telegram } = await req.json()
    if (!name?.trim() || !phone?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: 'Шаардлагатай талбар дутуу байна' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой' }, { status: 400 })
    }
    const normalizedEmail = email.toLowerCase().trim()
    const existing = await db.customer.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return NextResponse.json({ error: 'Энэ и-мэйлээр бүртгэлтэй байна. Нэвтэрнэ үү.' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const customer = await db.customer.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        email: normalizedEmail,
        passwordHash,
        telegram: telegram?.trim() || null,
      },
    })

    const token = signCustomerToken({ id: customer.id, email: customer.email, name: customer.name })
    const res = NextResponse.json({
      ok: true,
      customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone, telegram: customer.telegram },
    })
    res.cookies.set('customer_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    return res
  } catch (e) {
    console.error('Customer register error:', e)
    return NextResponse.json({ error: 'Бүртгэл үүсгэхэд алдаа гарлаа' }, { status: 500 })
  }
}
