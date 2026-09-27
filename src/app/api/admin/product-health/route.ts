import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/auth'
import { productHealthReport } from '@/lib/product-health-report'

export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  if (!getAdminFromRequest(req)) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })
  const report = await productHealthReport()
  return NextResponse.json(report, { headers: { 'Cache-Control': 'private, no-store' } })
}
