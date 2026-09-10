import { cartKey, validTerm } from '@/lib/license'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCustomerFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

async function readCart(customerId: string) {
  const customer = await db.customer.findUnique({ where: { id: customerId }, select: { cartItems: true, cartVersion: true } })
  if (!customer) return null
  const saved = JSON.parse(customer.cartItems) as { id: string; duration?: string; quantity: number }[]
  const products = await db.product.findMany({ where: { id: { in: saved.map(i => i.id) }, available: true } })
  return {
    version: customer.cartVersion,
    items: saved.flatMap(item => {
      const p = products.find(p => p.id === item.id)
      return p ? [{ id: p.id, name: p.name, price: p.price, icon: p.icon, category: p.category, duration: validTerm(item.duration) ? item.duration : 'Хугацаагүй', quantity: item.quantity }] : []
    }),
  }
}

export async function GET(req: NextRequest) {
  const customer = getCustomerFromRequest(req)
  if (!customer) return NextResponse.json({ error: 'Нэвтэрнэ үү' }, { status: 401 })
  try {
    const cart = await readCart(customer.sub)
    if (!cart) return NextResponse.json({ error: 'Хэрэглэгч олдсонгүй' }, { status: 401 })
    return NextResponse.json(cart, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ error: 'Сагс ачаалж чадсангүй. Өгөгдлийн сангийн шинэчлэл, холболтыг шалгана уу.' }, { status: 503 })
  }
}

export async function PUT(req: NextRequest) {
  const customer = getCustomerFromRequest(req)
  if (!customer) return NextResponse.json({ error: 'Нэвтэрнэ үү' }, { status: 401 })
  try {
    const { items, version, ownerId } = await req.json()
    if (ownerId !== customer.sub) return NextResponse.json({ error: 'Бүртгэл солигдсон байна' }, { status: 403 })
    if (!Number.isSafeInteger(version) || version < 0 || !Array.isArray(items) || items.length > 100 || items.some(i => !i || typeof i.id !== 'string' || (i.duration != null && !validTerm(i.duration)) || !Number.isSafeInteger(i.quantity) || i.quantity < 1 || i.quantity > 99)) {
      return NextResponse.json({ error: 'Сагсны мэдээлэл буруу байна' }, { status: 400 })
    }
    if (new Set(items.map(i => cartKey(i))).size !== items.length) return NextResponse.json({ error: 'Давхардсан бүтээгдэхүүн байна' }, { status: 400 })
    const result = await db.customer.updateMany({
      where: { id: customer.sub, cartVersion: version },
      data: { cartItems: JSON.stringify(items.map(i => ({ id: i.id, duration: i.duration || 'Хугацаагүй', quantity: i.quantity }))), cartVersion: { increment: 1 } },
    })
    if (!result.count) return NextResponse.json({ error: 'Сагс өөр төхөөрөмжөөс өөрчлөгдсөн. Шинэчилж байна.' }, { status: 409 })
    return NextResponse.json({ version: version + 1 })
  } catch {
    return NextResponse.json({ error: 'Сагс серверт хадгалагдсангүй. Дахин оролдоно уу.' }, { status: 503 })
  }
}
