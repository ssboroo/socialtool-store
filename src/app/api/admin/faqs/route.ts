import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })
  const faqs = await db.faq.findMany({ orderBy: { order: 'asc' } })
  return NextResponse.json(faqs)
}

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })
  try {
    const body = await req.json()
    const { question, answer, order } = body
    if (!question?.trim() || !answer?.trim()) return NextResponse.json({ error: 'Асуулт болон хариулт шаардлагатай' }, { status: 400 })
    const faq = await db.faq.create({
      data: {
        question: question.trim(),
        answer: answer.trim(),
        order: Number(order) || 0,
      },
    })
    return NextResponse.json(faq)
  } catch (e) {
    console.error('Admin faq create error:', e)
    return NextResponse.json({ error: 'Алдаа гарлаа' }, { status: 500 })
  }
}
