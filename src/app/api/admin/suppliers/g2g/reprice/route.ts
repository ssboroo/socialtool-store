import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

const CONFIG_KEY = 'supplier:g2g:config'
const DEFAULT_MARKUP = 100

type RepriceBody = {
  apply?: unknown
  markupPercent?: unknown
  currencyRates?: unknown
}

function roundToHundred(value: number) {
  if (!Number.isFinite(value) || value <= 0) return null
  return Math.max(100, Math.ceil(value / 100) * 100)
}

async function currentConfig() {
  const setting = await db.siteSetting.findUnique({ where: { key: CONFIG_KEY } })
  const currencyRates: Record<string, number> = { MNT: 1 }
  let markupPercent = 15

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

function ratesFromBody(raw: unknown, fallback: Record<string, number>) {
  const rates: Record<string, number> = { ...fallback, MNT: 1 }
  if (!raw || typeof raw !== 'object') return rates

  for (const [currency, value] of Object.entries(raw as Record<string, unknown>)) {
    const code = currency.trim().toUpperCase().slice(0, 8)
    const rate = Number(value)
    if (code && Number.isFinite(rate) && rate > 0 && rate < 1_000_000_000) rates[code] = rate
  }
  return rates
}

export async function POST(req: NextRequest) {
  if (!getAdminFromRequest(req)) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })

  try {
    const body = await req.json() as RepriceBody
    const saved = await currentConfig()
    const markupPercent = body.markupPercent == null ? DEFAULT_MARKUP : Number(body.markupPercent)
    if (!Number.isFinite(markupPercent) || markupPercent < 0 || markupPercent > 300) {
      return NextResponse.json({ error: 'Markup 0–300% хооронд байна' }, { status: 400 })
    }
    const currencyRates = ratesFromBody(body.currencyRates, saved.currencyRates)
    const apply = body.apply === true

    const g2gWhere = {
      OR: [
        { supplier: { startsWith: 'G2G' } },
        { sourceUrl: { contains: 'g2g.com' } },
      ],
    }

    const [totalG2G, items] = await Promise.all([
      db.supplierCatalogItem.count({ where: g2gWhere }),
      db.supplierCatalogItem.findMany({
        where: { ...g2gWhere, sourcePrice: { gt: 0 } },
        orderBy: [{ supplier: 'asc' }, { name: 'asc' }],
        take: 5000,
      }),
    ])

    const missingRates = new Map<string, number>()
    const calculable: Array<{
      id: string
      name: string
      productId: string | null
      oldSalePrice: number | null
      newSalePrice: number
      sourcePrice: number
      sourceCurrency: string
      rate: number
    }> = []

    for (const item of items) {
      const sourcePrice = Number(item.sourcePrice)
      const sourceCurrency = (item.sourceCurrency || 'MNT').trim().toUpperCase()
      const rate = currencyRates[sourceCurrency]
      if (!rate) {
        missingRates.set(sourceCurrency, (missingRates.get(sourceCurrency) || 0) + 1)
        continue
      }
      const newSalePrice = roundToHundred(sourcePrice * rate * (1 + markupPercent / 100))
      if (!newSalePrice) continue
      calculable.push({
        id: item.id,
        name: item.name,
        productId: item.productId,
        oldSalePrice: item.salePrice,
        newSalePrice,
        sourcePrice,
        sourceCurrency,
        rate,
      })
    }

    const changed = calculable.filter(item => item.oldSalePrice !== item.newSalePrice)
    const linkedProductIds = [...new Set(calculable.map(item => item.productId).filter((id): id is string => Boolean(id)))]
    const products = linkedProductIds.length
      ? await db.product.findMany({ where: { id: { in: linkedProductIds } }, select: { id: true, oldPrice: true } })
      : []
    const productById = new Map(products.map(product => [product.id, product]))

    if (apply) {
      for (let start = 0; start < calculable.length; start += 25) {
        const chunk = calculable.slice(start, start + 25)
        await Promise.all(chunk.map(async item => {
          await db.supplierCatalogItem.update({
            where: { id: item.id },
            data: { markupPercent, salePrice: item.newSalePrice },
          })
          if (!item.productId) return
          const product = productById.get(item.productId)
          if (!product) return
          const clearDiscount = product.oldPrice != null && product.oldPrice <= item.newSalePrice
          await db.product.update({
            where: { id: item.productId },
            data: {
              price: item.newSalePrice,
              ...(clearDiscount ? { oldPrice: null, discount: null } : {}),
            },
          })
        }))
      }

      await db.siteSetting.upsert({
        where: { key: CONFIG_KEY },
        update: { value: JSON.stringify({ markupPercent, currencyRates }) },
        create: { key: CONFIG_KEY, value: JSON.stringify({ markupPercent, currencyRates }) },
      })
    }

    return NextResponse.json({
      ok: true,
      apply,
      markupPercent,
      formula: 'sourcePrice × currencyRate × (1 + markupPercent / 100)',
      stats: {
        totalG2G,
        withSourcePrice: items.length,
        calculable: calculable.length,
        changed: changed.length,
        unchanged: calculable.length - changed.length,
        linkedProducts: products.length,
        unlinkedCatalogItems: calculable.filter(item => !item.productId).length,
        missingSourcePrice: Math.max(0, totalG2G - items.length),
      },
      missingRates: Object.fromEntries(missingRates),
      sample: changed.slice(0, 20).map(item => ({
        id: item.id,
        name: item.name,
        sourcePrice: item.sourcePrice,
        sourceCurrency: item.sourceCurrency,
        rate: item.rate,
        oldSalePrice: item.oldSalePrice,
        newSalePrice: item.newSalePrice,
        linkedToStore: Boolean(item.productId && productById.has(item.productId)),
      })),
    })
  } catch (error) {
    console.error('G2G repricing error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'G2G үнэ дахин тооцоолоход алдаа гарлаа' }, { status: 500 })
  }
}
