import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

const PRICE_CONFIG_KEY = 'supplier:g2g:config'

function cleanText(value: unknown, max: number, fallback = '') {
  if (typeof value !== 'string') return fallback
  return value.trim().slice(0, max)
}

function roundSalePrice(value: number) {
  return Math.max(100, Math.ceil(value / 100) * 100)
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

function parseG2GUrl(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('G2G бүтээгдэхүүний URL оруулна уу')
  let url: URL
  try { url = new URL(value.trim()) } catch { throw new Error('G2G URL буруу байна') }
  const host = url.hostname.toLowerCase().replace(/\.$/, '')
  if (url.protocol !== 'https:' || !(host === 'g2g.com' || host.endsWith('.g2g.com'))) {
    throw new Error('Зөвхөн https://g2g.com бүтээгдэхүүний холбоос ашиглана уу')
  }
  url.hash = ''
  return url
}

export async function POST(req: NextRequest) {
  if (!getAdminFromRequest(req)) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })

  try {
    const body = await req.json() as Record<string, unknown>
    const name = cleanText(body.name, 180)
    const serviceName = cleanText(body.serviceName, 100, 'G2G Marketplace') || 'G2G Marketplace'
    const brandName = cleanText(body.brandName, 100) || null
    const regionName = cleanText(body.regionName, 80) || null
    const sourceCurrency = (cleanText(body.sourceCurrency, 8, 'USD') || 'USD').toUpperCase().replace(/[^A-Z0-9]/g, '')
    const sourcePrice = Number(body.sourcePrice)
    const url = parseG2GUrl(body.sourceUrl)

    if (!name) return NextResponse.json({ error: 'Бүтээгдэхүүний нэр оруулна уу' }, { status: 400 })
    if (!Number.isFinite(sourcePrice) || sourcePrice <= 0) return NextResponse.json({ error: 'G2G өртгийг зөв оруулна уу' }, { status: 400 })

    const config = await readPriceConfig()
    const manualSalePrice = body.salePrice == null || body.salePrice === '' ? null : Number(body.salePrice)
    let salePrice: number
    if (manualSalePrice !== null) {
      if (!Number.isSafeInteger(manualSalePrice) || manualSalePrice <= 0) {
        return NextResponse.json({ error: 'Зарах үнэ бүхэл эерэг ₮ дүн байна' }, { status: 400 })
      }
      salePrice = manualSalePrice
    } else {
      const rate = config.currencyRates[sourceCurrency]
      if (!rate) {
        return NextResponse.json({
          error: `${sourceCurrency} ханш тохируулаагүй байна. Нийлүүлэгч → Үнэ тооцоолол дээр ${sourceCurrency}=... нэмнэ үү.`,
        }, { status: 400 })
      }
      salePrice = roundSalePrice(sourcePrice * rate * (1 + config.markupPercent / 100))
    }

    const stableKey = `${url.hostname.toLowerCase()}${url.pathname.replace(/\/+$/, '')}`
    const externalId = `manual-${createHash('sha256').update(stableKey).digest('hex').slice(0, 24)}`
    const now = new Date()
    const item = await db.supplierCatalogItem.upsert({
      where: { supplier_externalId: { supplier: 'G2G', externalId } },
      update: {
        name,
        serviceName,
        brandName,
        regionName,
        sourceUrl: url.toString(),
        sourceCurrency,
        sourcePrice,
        markupPercent: config.markupPercent,
        salePrice,
        available: true,
        metadata: JSON.stringify({ mode: 'manual-reseller', source: 'G2G', stableKey }),
        lastSyncedAt: now,
      },
      create: {
        supplier: 'G2G',
        externalId,
        name,
        serviceName,
        brandName,
        regionName,
        sourceUrl: url.toString(),
        sourceCurrency,
        sourcePrice,
        markupPercent: config.markupPercent,
        salePrice,
        available: true,
        metadata: JSON.stringify({ mode: 'manual-reseller', source: 'G2G', stableKey }),
        lastSyncedAt: now,
      },
    })

    return NextResponse.json({ ok: true, itemId: item.id, salePrice, markupPercent: config.markupPercent, published: item.published })
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Хүсэлтийн бүтэц буруу байна' }, { status: 400 })
    const message = error instanceof Error ? error.message : 'G2G бараа хадгалахад алдаа гарлаа'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
