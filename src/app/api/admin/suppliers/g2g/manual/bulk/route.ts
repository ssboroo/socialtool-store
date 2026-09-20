import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'
import { translateG2GProductNameMn, translateG2GRegionMn, translateG2GTextMn } from '@/lib/g2g-mn'

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
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith('utm_') || ['ref', 'source', 'campaign'].includes(key.toLowerCase())) {
      url.searchParams.delete(key)
    }
  }
  return url
}

async function readPriceConfig() {
  let markupPercent = 100
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
    const body = await req.json() as { rows?: BulkRow[]; markupPercent?: unknown }
    const rows = Array.isArray(body.rows) ? body.rows.slice(0, MAX_ROWS) : []
    if (!rows.length) return NextResponse.json({ error: 'Импортлох мөр олдсонгүй' }, { status: 400 })

    const config = await readPriceConfig()
    const requestedMarkup = body.markupPercent == null ? config.markupPercent : Number(body.markupPercent)
    if (!Number.isFinite(requestedMarkup) || requestedMarkup < 0 || requestedMarkup > 300) {
      return NextResponse.json({ error: 'Markup 0–300% хооронд байна' }, { status: 400 })
    }
    const markupPercent = requestedMarkup

    const summary = { created: 0, updated: 0, priced: 0, drafts: 0, translated: 0, errors: 0 }
    const results: Array<{
      row: number
      status: 'created' | 'updated' | 'error'
      itemId?: string
      name?: string
      salePrice?: number | null
      sourcePrice?: number | null
      sourceCurrency?: string
      error?: string
    }> = []

    for (let index = 0; index < rows.length; index += 1) {
      try {
        const row = rows[index]
        const originalName = cleanText(row.name, 240)
        if (!originalName) throw new Error('Бүтээгдэхүүний нэр дутуу')

        const originalServiceName = cleanText(row.serviceName, 120, 'Дижитал хэрэгсэл') || 'Дижитал хэрэгсэл'
        const originalRegionName = cleanText(row.regionName, 80)
        const name = translateG2GProductNameMn(originalName) || originalName
        const serviceName = translateG2GTextMn(originalServiceName) || originalServiceName
        const regionName = originalRegionName ? (translateG2GRegionMn(originalRegionName) || originalRegionName) : null
        const brandName = cleanText(row.brandName, 100) || null
        const url = parseG2GUrl(row.sourceUrl)
        const sourceCurrency = (cleanText(row.sourceCurrency, 8, 'USD') || 'USD').toUpperCase().replace(/[^A-Z0-9]/g, '') || 'USD'

        const rawSourcePrice = row.sourcePrice == null || row.sourcePrice === '' ? null : Number(row.sourcePrice)
        const sourcePrice = rawSourcePrice !== null && Number.isFinite(rawSourcePrice) && rawSourcePrice > 0 ? rawSourcePrice : null
        const rawSalePrice = row.salePrice == null || row.salePrice === '' ? null : Number(row.salePrice)
        let salePrice = rawSalePrice !== null && Number.isSafeInteger(rawSalePrice) && rawSalePrice > 0 ? rawSalePrice : null
        if (salePrice == null && sourcePrice != null && config.currencyRates[sourceCurrency]) {
          salePrice = roundSalePrice(sourcePrice * config.currencyRates[sourceCurrency] * (1 + markupPercent / 100))
        }

        const normalizedUrl = url.toString()
        const stableKey = `${normalizedUrl}|${originalName.toLowerCase()}`
        const externalId = `manual-bulk-${createHash('sha256').update(stableKey).digest('hex').slice(0, 24)}`
        const existing = await db.supplierCatalogItem.findUnique({
          where: { supplier_externalId: { supplier: 'G2G', externalId } },
        })

        const finalSourcePrice = sourcePrice ?? existing?.sourcePrice ?? null
        let finalSalePrice = salePrice
        const finalCurrency = sourcePrice != null ? sourceCurrency : (existing?.sourceCurrency || sourceCurrency)

        if (finalSalePrice == null && finalSourcePrice != null && config.currencyRates[finalCurrency]) {
          finalSalePrice = roundSalePrice(finalSourcePrice * config.currencyRates[finalCurrency] * (1 + markupPercent / 100))
        }
        finalSalePrice = finalSalePrice ?? existing?.salePrice ?? null

        const now = new Date()
        const translated = name !== originalName || serviceName !== originalServiceName || (regionName || '') !== originalRegionName
        const metadata = JSON.stringify({
          mode: 'manual-paste',
          source: 'G2G',
          stableKey,
          original: {
            name: originalName,
            serviceName: originalServiceName,
            regionName: originalRegionName || null,
          },
          mongolian: {
            name,
            serviceName,
            regionName,
          },
          pricing: {
            markupPercent,
            sourcePrice: finalSourcePrice,
            sourceCurrency: finalCurrency,
            salePrice: finalSalePrice,
          },
          importedAt: now.toISOString(),
        })

        const item = await db.supplierCatalogItem.upsert({
          where: { supplier_externalId: { supplier: 'G2G', externalId } },
          update: {
            name,
            serviceName,
            brandName,
            regionName,
            sourceUrl: normalizedUrl,
            sourceCurrency: finalCurrency,
            sourcePrice: finalSourcePrice,
            markupPercent,
            salePrice: finalSalePrice,
            available: true,
            metadata,
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
            markupPercent,
            salePrice: finalSalePrice,
            available: true,
            published: false,
            metadata,
            lastSyncedAt: now,
          },
        })

        if (existing) summary.updated += 1
        else summary.created += 1
        if (finalSalePrice != null) summary.priced += 1
        else summary.drafts += 1
        if (translated) summary.translated += 1

        results.push({
          row: index + 1,
          status: existing ? 'updated' : 'created',
          itemId: item.id,
          name: item.name,
          salePrice: item.salePrice,
          sourcePrice: item.sourcePrice,
          sourceCurrency: item.sourceCurrency || finalCurrency,
        })
      } catch (error) {
        summary.errors += 1
        results.push({ row: index + 1, status: 'error', error: error instanceof Error ? error.message : 'Импорт алдаа' })
      }
    }

    return NextResponse.json({ ok: true, markupPercent, summary, results })
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Хүсэлтийн бүтэц буруу байна' }, { status: 400 })
    console.error('G2G bulk draft import error:', error)
    return NextResponse.json({ error: 'G2G жагсаалт импортлоход алдаа гарлаа' }, { status: 500 })
  }
}
