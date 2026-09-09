import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const faqs = await db.faq.findMany({ orderBy: { order: 'asc' } })
  return NextResponse.json(faqs.map((f) => ({ id: f.id, q: f.question, a: f.answer, order: f.order })))
}
