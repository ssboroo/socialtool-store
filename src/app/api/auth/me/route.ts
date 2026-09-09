import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCustomerFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const decoded = getCustomerFromRequest(req)
  if (!decoded) return NextResponse.json({ customer: null })
  const customer = await db.customer.findUnique({ where: { id: decoded.sub } })
  if (!customer) return NextResponse.json({ customer: null })
  return NextResponse.json({
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      telegram: customer.telegram,
      createdAt: customer.createdAt,
    },
  })
}
