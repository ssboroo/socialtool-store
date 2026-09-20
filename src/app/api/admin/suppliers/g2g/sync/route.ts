import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'
import { getG2GProducts, g2gConfigured, searchG2GLiveOffersByBrand, type G2GOffer } from '@/lib/g2g'
import { g2gMongolianShortDescription, translateG2GProductNameMn, translateG2GRegionMn, translateG2GTextMn } from '@/lib/g2g-mn'

const CONFIG_KEY = 'supplier:g2g:config'

function clean(value: unknown, max = 180) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function roundSalePrice(value: number) {
  if (!Number.isFinite(value) || value <= 0) return null
  return Math.max(100, Math.ceil(value / 100) * 100)
}

async function readPricingConfig() {
  const setting = await db.siteSetting.findUnique({ where: { key: CONFIG_KEY } })
  let markupPercent = 100
  const currencyRates: Record<string, number> = { MNT: 1 }

  if (setting) {
    try {
      const parsed = JSON.parse(setting.value) as { markupPercent?: unknown; currencyRates?: unknown }
      const markup = Number(parsed.markupPercent)
      if (Number.isFinite(markup) && markup >= 0 && markup <= 300) markupPercent = markup

      if (parsed.currencyRates && typeof parsed.currencyRates === 'object') {
        for (const [currency, raw] of Object.entries(parsed.currencyRates as Record<string, unknown>)) {
          const code = currency.trim().toUpperCase().slice(0, 8)
          const rate = Number(raw)
          if (code && Number.isFinite(rate) && rate > 0 && rate < 1_000_000_000) currencyRates[code] = rate
        }
      }
    } catch {}
  }

  return { markupPercent, currencyRates }
}

function chooseBestOffer(offers: G2GOffer[], currencyRates: Record<string, number>) {
  const priced = offers
    .map(offer => {
      const unitPrice = Number(offer.unit_price)
      const currency = clean(offer.currency, 8).toUpperCase()
      const rate = currencyRates[currency]
      if (!Number.isFinite(unitPrice) || unitPrice <= 0 || !currency || !rate) return null
      return {
        offer,
        unitPrice,
        currency,
        rate,
        costMnt: unitPrice * rate,
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) => a.costMnt - b.costMnt)

  return priced[0] || null
}

export async function POST(req: NextRequest) {
  if (!getAdminFromRequest(req)) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })
  if (!g2gConfigured()) {
    return NextResponse.json({
      ok: true,
      disabled: true,
      synced: 0,
      priced: 0,
      translated: 0,
      message: 'G2G API access байхгүй. G2G-аас бараа болон live үнэ татахын тулд approved OpenAPI credentials шаардлагатай.',
    })
  }

  try {
    const body = await req.json() as Record<string, unknown>
    const serviceId = clean(body.serviceId)
    const serviceName = clean(body.serviceName) || 'G2G'
    const brandId = clean(body.brandId)
    const brandName = clean(body.brandName) || 'G2G'
    const categoryId = clean(body.categoryId) || undefined
    const categoryName = clean(body.categoryName) || null
    if (!serviceId || !brandId) return NextResponse.json({ error: 'serviceId болон brandId шаардлагатай' }, { status: 400 })

    const [products, offerResult, pricing] = await Promise.all([
      getG2GProducts(serviceId, brandId, categoryId),
      searchG2GLiveOffersByBrand(brandId),
      readPricingConfig(),
    ])

    const offersByProduct = new Map<string, G2GOffer[]>()
    let offersWithoutProductId = 0

    for (const offer of offerResult.offers) {
      const productId = clean(offer.product_id)
      if (!productId) {
        offersWithoutProductId += 1
        continue
      }
      const current = offersByProduct.get(productId) || []
      current.push(offer)
      offersByProduct.set(productId, current)
    }

    const now = new Date()
    let synced = 0
    let priced = 0
    let translated = 0
    let linkedStorePricesUpdated = 0
    const missingRateCurrencies = new Set<string>()

    for (let start = 0; start < products.length; start += 100) {
      const chunk = products.slice(start, start + 100)
      const saved = await db.$transaction(chunk.map(product => {
        const originalName = clean(product.product_name, 300) || `${brandName} ${product.product_id}`
        const mongolianName = translateG2GProductNameMn(originalName) || originalName
        const originalRegion = clean(product.region_name, 80)
        const mongolianRegion = translateG2GRegionMn(originalRegion) || originalRegion || null
        const originalServiceName = clean(product.service_name) || serviceName
        const mongolianServiceName = translateG2GTextMn(originalServiceName)
        const productOffers = offersByProduct.get(product.product_id) || []

        for (const offer of productOffers) {
          const currency = clean(offer.currency, 8).toUpperCase()
          if (currency && !pricing.currencyRates[currency]) missingRateCurrencies.add(currency)
        }

        const best = chooseBestOffer(productOffers, pricing.currencyRates)
        const salePrice = best
          ? roundSalePrice(best.costMnt * (1 + pricing.markupPercent / 100))
          : null
        const available = productOffers.length
          ? productOffers.some(offer => offer.available_qty == null || Number(offer.available_qty) > 0)
          : true

        if (best && salePrice) priced += 1
        if (mongolianName !== originalName || mongolianRegion !== originalRegion) translated += 1

        const metadata = JSON.stringify({
          provider: 'G2G_OPENAPI',
          originalProduct: product,
          originalName,
          mongolianName,
          mongolianServiceName,
          mongolianRegion,
          shortDescriptionMn: g2gMongolianShortDescription({
            brandName: clean(product.brand_name) || brandName,
            serviceName: originalServiceName,
            regionName: originalRegion,
          }),
          liveOffers: {
            count: productOffers.length,
            searchTruncated: offerResult.truncated,
            bestOffer: best ? {
              offerId: best.offer.offer_id,
              sellerId: best.offer.seller_id || null,
              title: best.offer.title || null,
              description: best.offer.description || null,
              currency: best.currency,
              unitPrice: best.unitPrice,
              availableQty: best.offer.available_qty ?? null,
              convertedCostMnt: Math.round(best.costMnt),
            } : null,
          },
          syncedAt: now.toISOString(),
        })

        const priceData = best && salePrice ? {
          sourcePrice: best.unitPrice,
          sourceCurrency: best.currency,
          salePrice,
          markupPercent: pricing.markupPercent,
        } : {
          markupPercent: pricing.markupPercent,
        }

        return db.supplierCatalogItem.upsert({
          where: { supplier_externalId: { supplier: 'G2G', externalId: product.product_id } },
          update: {
            serviceId,
            serviceName: originalServiceName,
            categoryId: categoryId || null,
            categoryName: categoryName ? translateG2GTextMn(categoryName) : null,
            brandId,
            brandName: clean(product.brand_name) || brandName,
            regionName: mongolianRegion,
            name: mongolianName,
            available,
            ...priceData,
            metadata,
            lastSyncedAt: now,
          },
          create: {
            supplier: 'G2G',
            externalId: product.product_id,
            serviceId,
            serviceName: originalServiceName,
            categoryId: categoryId || null,
            categoryName: categoryName ? translateG2GTextMn(categoryName) : null,
            brandId,
            brandName: clean(product.brand_name) || brandName,
            regionName: mongolianRegion,
            name: mongolianName,
            available,
            ...priceData,
            metadata,
            lastSyncedAt: now,
          },
        })
      }))

      const linked = saved.filter(item => item.productId && item.salePrice && item.salePrice > 0)
      await Promise.all(linked.map(item => db.product.updateMany({
        where: { id: item.productId! },
        data: {
          price: item.salePrice!,
          available: item.available,
        },
      })))
      linkedStorePricesUpdated += linked.length
      synced += chunk.length
    }

    return NextResponse.json({
      ok: true,
      synced,
      priced,
      translated,
      liveOffers: offerResult.offers.length,
      offersWithoutProductId,
      offersTruncated: offerResult.truncated,
      linkedStorePricesUpdated,
      missingRateCurrencies: [...missingRateCurrencies].sort(),
      markupPercent: pricing.markupPercent,
      brandId,
      brandName,
    })
  } catch (error) {
    console.error('G2G brand sync error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'G2G бүтээгдэхүүн болон үнэ sync хийхэд алдаа гарлаа' }, { status: 502 })
  }
}
