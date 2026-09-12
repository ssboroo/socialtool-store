import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'
import { g2aConfigured, getG2AProductOffers, getG2AProducts, type G2AProductMetadata } from '@/lib/g2a'

const PRICE_CONFIG_KEY = 'supplier:g2g:config'
const CURSOR_KEY = 'supplier:g2a:cursor'

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

async function readCursor() {
  const setting = await db.siteSetting.findUnique({ where: { key: CURSOR_KEY } })
  const page = Number(setting?.value || 1)
  return Number.isInteger(page) && page >= 1 ? page : 1
}

async function saveCursor(page: number) {
  await db.siteSetting.upsert({
    where: { key: CURSOR_KEY },
    update: { value: String(page) },
    create: { key: CURSOR_KEY, value: String(page) },
  })
}

function roundSalePrice(value: number) {
  if (!Number.isFinite(value) || value <= 0) return null
  return Math.max(100, Math.ceil(value / 100) * 100)
}

function safeG2AUrl(slug: string | undefined) {
  if (!slug || !/^[a-z0-9][a-z0-9-]*$/i.test(slug)) return null
  return `https://www.g2a.com/${slug}`
}

async function fetchMetadata(ids: string[]) {
  const all: G2AProductMetadata[] = []
  for (let start = 0; start < ids.length; start += 20) {
    all.push(...await getG2AProducts(ids.slice(start, start + 20)))
  }
  return new Map(all.map(product => [product.id, product]))
}

export async function GET(req: NextRequest) {
  if (!getAdminFromRequest(req)) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })
  const [nextPage, total, priced, latest, priceConfig] = await Promise.all([
    readCursor(),
    db.supplierCatalogItem.count({ where: { supplier: 'G2A' } }),
    db.supplierCatalogItem.count({ where: { supplier: 'G2A', salePrice: { gt: 0 } } }),
    db.supplierCatalogItem.findFirst({ where: { supplier: 'G2A' }, orderBy: { lastSyncedAt: 'desc' }, select: { lastSyncedAt: true } }),
    readPriceConfig(),
  ])
  return NextResponse.json({
    configured: g2aConfigured(),
    requiredEnv: ['G2A_CLIENT_ID', 'G2A_CLIENT_SECRET'],
    apiUrl: process.env.G2A_API_URL?.trim() || 'https://api.g2a.com',
    nextPage,
    eurRateConfigured: Boolean(priceConfig.currencyRates.EUR),
    stats: { total, priced, lastSyncedAt: latest?.lastSyncedAt || null },
  })
}

export async function POST(req: NextRequest) {
  if (!getAdminFromRequest(req)) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })
  if (!g2aConfigured()) {
    return NextResponse.json({ error: 'G2A Export API credentials дутуу байна' }, { status: 409 })
  }

  try {
    const body = await req.json().catch(() => ({})) as { reset?: unknown }
    const page = body.reset === true ? 1 : await readCursor()
    const priceConfig = await readPriceConfig()
    const feed = await getG2AProductOffers(page, 100)
    const products = feed.data || []
    const metadata = await fetchMetadata(products.map(product => product.id))
    const now = new Date()
    const eurRate = priceConfig.currencyRates.EUR

    const operations = products.map(product => {
      const meta = metadata.get(product.id)
      const sourcePrice = Number(product.minPrice)
      const validSourcePrice = Number.isFinite(sourcePrice) && sourcePrice > 0 ? sourcePrice : null
      const salePrice = validSourcePrice && eurRate
        ? roundSalePrice(validSourcePrice * eurRate * (1 + priceConfig.markupPercent / 100))
        : null
      const serviceName = meta?.categories?.[0]?.name?.trim() || 'G2A Digital'
      const platform = meta?.platform?.trim() || meta?.publisher?.trim() || null
      const region = meta?.region?.trim() || null
      const sourceUrl = safeG2AUrl(meta?.slug)
      const metadataJson = JSON.stringify({
        provider: 'G2A',
        product: meta || null,
        offers: product.offers || [],
        totalQuantity: product.totalQuantity,
        minPrice: product.minPrice,
        currency: product.currency,
        updatedAt: product.updatedAt,
      })

      return db.supplierCatalogItem.upsert({
        where: { supplier_externalId: { supplier: 'G2A', externalId: product.id } },
        update: {
          serviceName,
          brandName: platform,
          regionName: region,
          name: meta?.name?.trim() || product.name,
          sourceUrl,
          sourceCurrency: product.currency || 'EUR',
          sourcePrice: validSourcePrice,
          markupPercent: priceConfig.markupPercent,
          ...(salePrice ? { salePrice } : {}),
          available: Number(product.totalQuantity || 0) > 0,
          metadata: metadataJson,
          lastSyncedAt: now,
        },
        create: {
          supplier: 'G2A',
          externalId: product.id,
          serviceName,
          brandName: platform,
          regionName: region,
          name: meta?.name?.trim() || product.name,
          sourceUrl,
          sourceCurrency: product.currency || 'EUR',
          sourcePrice: validSourcePrice,
          markupPercent: priceConfig.markupPercent,
          salePrice,
          available: Number(product.totalQuantity || 0) > 0,
          metadata: metadataJson,
          lastSyncedAt: now,
        },
      })
    })

    const syncedItems = []
    for (let start = 0; start < operations.length; start += 50) {
      syncedItems.push(...await db.$transaction(operations.slice(start, start + 50)))
    }

    const productUpdates = syncedItems
      .filter(item => item.published && item.productId && item.salePrice)
      .map(item => db.product.update({
        where: { id: item.productId! },
        data: { price: item.salePrice!, available: item.available },
      }))
    for (let start = 0; start < productUpdates.length; start += 50) {
      await db.$transaction(productUpdates.slice(start, start + 50))
    }

    const nextPage = feed.meta?.hasNext ? page + 1 : 1
    await saveCursor(nextPage)

    return NextResponse.json({
      ok: true,
      page,
      nextPage,
      synced: products.length,
      totalResults: feed.meta?.totalResults || products.length,
      hasNext: Boolean(feed.meta?.hasNext),
      eurRateConfigured: Boolean(eurRate),
    })
  } catch (error) {
    console.error('G2A supplier sync error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'G2A sync алдаа' }, { status: 502 })
  }
}
