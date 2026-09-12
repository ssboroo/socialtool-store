import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

const PRICE_CONFIG_KEY = 'supplier:g2g:config'
const MAX_ROWS = 500

type BulkRow = {
  serviceName?: unknown
  name?: unknown
  sourceUrl?: unknown
  sourcePrice?: unknown
  sourceCurrency?: unknown
  salePrice?: unknown
  brandName?: unknown
  regionName?: unknown
}

function cleanText(value: unknown, max: number, fallback = '') {
  if (typeof value !== 'string') return fallback
  return value.trim().slice(0, max)
}

function roundSalePrice(value: number) {
  return Math.max(100, Math.ceil(value / 100) * 100)
}

function parseG2GUrl(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('G2G URL дутуу')
  let url: URL
  try { url = new URL(value.trim().replace(/\\/g, '')) } catch { throw new Error('G2G URL буруу байна') }
  const host = url.hostname.toLowerCase().replace(/\.$/, '')
  if (url.protocol !== 'https:' || !(host === 'g2g.com' || host.endsWith('.g2g.com'))) {
    throw new Error('Зөвхөн https://g2g.com холбоос ашиглана уу')
  }
  url.hash = ''
  return url
}

async function readPriceConfig() {
  let markupPercent = 15
  const currencyRates: Record<string, number> = { MNT: 1 }
  const setting = await db.siteSetting.findUnique({ where: { key: PRICE_CONFIG_KEY } })
  if (setting) {
    try {
      const parsed = JSON.parse(setting.value) as { markupPercent?: unknown; currencyRates?: Record<string, unknown> }
      const markup = Number(parsed.markupPercent)
      if (Number.isFinite(markup) && markup >= 0 && markup <= 300) markupPercent = markup
      for (const [currency, raw] of Object.entries(parsed.currencyRates || {})) {
        const rate = Number(raw)
        if (Number.isFinite(rate) && rate > 0) currencyRates[currency.toUpperCase()] = rate
      }
    } catch {}
  }
  return { markupPercent, currencyRates }
}

export async function POST(req: NextRequest) {
  if (!getAdminFromRequest(req)) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })

  try {
    const body = await req.json() as { rows?: BulkRow[] }
    const rows = Array.isArray(body.rows) ? body.rows.slice(0, MAX_ROWS) : []
    if (!rows.length) return NextResponse.json({ error: 'Импортлох мөр олдсонгүй' }, { status: 400 })

    const config = await readPriceConfig()
    const summary = { created: 0, updated: 0, priced: 0, drafts: 0, errors: 0 }
    const results: Array<{ row: number; status: 'created' | 'updated' | 'error'; error?: string }> = []

    for (let index = 0; index < rows.length; index += 1) {
      try {
        const row = rows[index]
        const name = cleanText(row.name, 180)
        if (!name) throw new Error('Бүтээгдэхүүний нэр дутуу')
        const serviceName = cleanText(row.serviceName, 100, 'G2G Marketplace') || 'G2G Marketplace'
        const brandName = cleanText(row.brandName, 100) || serviceName
        const regionName = cleanText(row.regionName, 80) || null
        const url = parseG2GUrl(row.sourceUrl)
        const sourceCurrency = (cleanText(row.sourceCurrency, 8, 'USD') || 'USD').toUpperCase().replace(/[^A-Z0-9]/g, '') || 'USD'

        const rawSourcePrice = row.sourcePrice == null || row.sourcePrice === '' ? null : Number(row.sourcePrice)
        const sourcePrice = rawSourcePrice !== null && Number.isFinite(rawSourcePrice) && rawSourcePrice > 0 ? rawSourcePrice : null
        const rawSalePrice = row.salePrice == null || row.salePrice === '' ? null : Number(row.salePrice)
        let salePrice = rawSalePrice !== null && Number.isSafeInteger(rawSalePrice) && rawSalePrice > 0 ? rawSalePrice : null
        if (salePrice == null && sourcePrice != null && config.currencyRates[sourceCurrency]) {
          salePrice = roundSalePrice(sourcePrice * config.currencyRates[sourceCurrency] * (1 + config.markupPercent / 100))
        }

        const normalizedUrl = url.toString()
        const stableKey = `${normalizedUrl}|${name.toLowerCase()}`
        const externalId = `manual-bulk-${createHash('sha256').update(stableKey).digest('hex').slice(0, 24)}`
        const existing = await db.supplierCatalogItem.findUnique({
          where: { supplier_externalId: { supplier: 'G2G', externalId } },
        })

        const finalSourcePrice = sourcePrice ?? existing?.sourcePrice ?? null
        const finalSalePrice = salePrice ?? existing?.salePrice ?? null
        const finalCurrency = sourcePrice != null ? sourceCurrency : (existing?.sourceCurrency || sourceCurrency)
        const now = new Date()

        await db.supplierCatalogItem.upsert({
          where: { supplier_externalId: { supplier: 'G2G', externalId } },
          update: {
            name,
            serviceName,
            brandName,
            regionName,
            sourceUrl: normalizedUrl,
            sourceCurrency: finalCurrency,
            sourcePrice: finalSourcePrice,
            markupPercent: config.markupPercent,
            salePrice: finalSalePrice,
            available: true,
            metadata: JSON.stringify({ mode: 'manual-bulk', source: 'G2G', stableKey }),
            lastSyncedAt: now,
          },
          create: {
            supplier: 'G2G',
            externalId,
            name,
            serviceName,
            brandName,
            regionName,
            sourceUrl: normalizedUrl,
            sourceCurrency: finalCurrency,
            sourcePrice: finalSourcePrice,
            markupPercent: config.markupPercent,
            salePrice: finalSalePrice,
            available: true,
            published: false,
            metadata: JSON.stringify({ mode: 'manual-bulk', source: 'G2G', stableKey }),
            lastSyncedAt: now,
          },
        })

        if (existing) summary.updated += 1
        else summary.created += 1
        if (finalSalePrice != null) summary.priced += 1
        else summary.drafts += 1
        results.push({ row: index + 1, status: existing ? 'updated' : 'created' })
      } catch (error) {
        summary.errors += 1
        results.push({ row: index + 1, status: 'error', error: error instanceof Error ? error.message : 'Импорт алдаа' })
      }
    }

    return NextResponse.json({ ok: true, summary, results })
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Хүсэлтийн бүтэц буруу байна' }, { status: 400 })
    console.error('G2G bulk draft import error:', error)
    return NextResponse.json({ error: 'G2G жагсаалт импортлоход алдаа гарлаа' }, { status: 500 })
  }
}
