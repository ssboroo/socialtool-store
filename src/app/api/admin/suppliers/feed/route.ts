import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/auth'
import { readSupplierFeedConfig, syncSupplierFeed } from '@/lib/supplier-feed'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  if (!getAdminFromRequest(req)) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })
  const config = await readSupplierFeedConfig()
  return NextResponse.json({
    configured: Boolean(config),
    supplierName: config?.supplierName || 'ENEBA',
    defaultCurrency: config?.defaultCurrency || 'EUR',
    feedHost: config?.feedUrl ? new URL(config.feedUrl).hostname : null,
    lastSyncedAt: config?.lastSyncedAt || null,
    maxRows: 5000,
    defaultAllowedHost: '*.eneba.com',
    extraAllowedHostsConfigured: Boolean(process.env.SUPPLIER_FEED_ALLOWED_HOSTS?.trim()),
  })
}

export async function POST(req: NextRequest) {
  if (!getAdminFromRequest(req)) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })
  try {
    const body = await req.json().catch(() => ({})) as {
      supplierName?: unknown
      feedUrl?: unknown
      defaultCurrency?: unknown
      limit?: unknown
    }
    const saved = await readSupplierFeedConfig()
    const providedUrl = typeof body.feedUrl === 'string' ? body.feedUrl.trim() : ''
    const feedUrl = providedUrl || saved?.feedUrl || ''
    if (!feedUrl) return NextResponse.json({ error: 'XML/CSV Feed URL оруулна уу' }, { status: 400 })
    const supplierName = typeof body.supplierName === 'string' && body.supplierName.trim()
      ? body.supplierName
      : saved?.supplierName || 'ENEBA'
    const defaultCurrency = typeof body.defaultCurrency === 'string' && body.defaultCurrency.trim()
      ? body.defaultCurrency
      : saved?.defaultCurrency || 'EUR'
    const limit = Number(body.limit)
    const result = await syncSupplierFeed({
      supplierName,
      feedUrl,
      defaultCurrency,
      limit: Number.isFinite(limit) ? limit : undefined,
      saveConfig: true,
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Supplier feed sync error:', error)
    const message = error instanceof Error ? error.message : 'Supplier feed sync алдаа'
    const status = /зөвшөөрөгдсөн feed host биш|Private\/local|private\/local|HTTPS/.test(message) ? 403 : 502
    return NextResponse.json({ error: message }, { status })
  }
}
