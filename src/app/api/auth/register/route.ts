import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { signCustomerToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) return NextResponse.json({ error: 'Бүртгэлийн серверийн тохиргоо дутуу байна. Админтай холбогдоно уу.' }, { status: 503 })
    const body = await req.json() as Record<string, unknown>
    const { name, phone, email, password, telegram } = body
    if ([name, phone, email, password].some((v) => typeof v !== 'string' || !v.trim()) || (telegram != null && typeof telegram !== 'string')) {
      return NextResponse.json({ error: 'Шаардлагатай талбар дутуу байна' }, { status: 400 })
    }

    const safeName = (name as string).trim()
    const safePhone = (phone as string).trim()
    const safeEmail = (email as string).toLowerCase().trim()
    const safePassword = password as string
    const safeTelegram = typeof telegram === 'string' ? telegram.trim() : ''

    if (safeName.length > 120 || safePhone.length < 3 || safePhone.length > 32 || safeTelegram.length > 80) {
      return NextResponse.json({ error: 'Нэр, утас эсвэл Telegram хаяг буруу байна' }, { status: 400 })
    }
    if (safePassword.length < 6 || safePassword.length > 128) {
      return NextResponse.json({ error: 'Нууц үг 6–128 тэмдэгт байх ёстой' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeEmail) || safeEmail.length > 254) {
      return NextResponse.json({ error: 'И-мэйл хаяг буруу байна' }, { status: 400 })
    }
    const existing = await db.customer.findUnique({ where: { email: safeEmail } })
    if (existing) {
      return NextResponse.json({ error: 'Энэ и-мэйлээр бүртгэлтэй байна. Нэвтэрнэ үү.' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(safePassword, 10)
    const customer = await db.customer.create({
      data: {
        name: safeName,
        phone: safePhone,
        email: safeEmail,
        passwordHash,
        telegram: safeTelegram || null,
      },
    })

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
    if (e instanceof SyntaxError) return NextResponse.json({ error: 'Хүсэлтийн бүтэц буруу байна' }, { status: 400 })
    if (e && typeof e === 'object' && 'code' in e && e.code === 'P2002') {
      return NextResponse.json({ error: 'Энэ и-мэйлээр бүртгэлтэй байна' }, { status: 409 })
    }
    console.error('Customer register error:', e)
    return NextResponse.json({ error: 'Бүртгэл үүсгэхэд алдаа гарлаа' }, { status: 500 })
  }
}
