import { NextRequest, NextResponse } from 'next/server'
import { readSupplierFeedConfig, syncSupplierFeed } from '@/lib/supplier-feed'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function run(req: NextRequest) {
  const secret = process.env.SUPPLIER_FEED_CRON_SECRET?.trim()
  if (!secret) return NextResponse.json({ error: 'SUPPLIER_FEED_CRON_SECRET тохируулаагүй байна' }, { status: 503 })
  const auth = req.headers.get('authorization') || ''
  const headerSecret = req.headers.get('x-cron-secret') || ''
  if (auth !== `Bearer ${secret}` && headerSecret !== secret) {
    return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })
  }
  try {
    const config = await readSupplierFeedConfig()
    if (!config) return NextResponse.json({ error: 'Saved supplier feed байхгүй байна' }, { status: 409 })
    const result = await syncSupplierFeed({
      supplierName: config.supplierName,
      feedUrl: config.feedUrl,
      defaultCurrency: config.defaultCurrency,
      saveConfig: true,
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Supplier feed cron error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Supplier feed cron алдаа' }, { status: 502 })
  }
}

export async function GET(req: NextRequest) { return run(req) }
export async function POST(req: NextRequest) { return run(req) }
