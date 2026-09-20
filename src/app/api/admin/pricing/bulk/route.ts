import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

type RuleType = 'percentage' | 'multiplier' | 'fixed' | 'direct' | 'sourceMarkup'
type ScopeType = 'all' | 'category' | 'supplier' | 'search'

type BulkPriceBody = {
  apply?: unknown
  scope?: unknown
  categoryId?: unknown
  supplier?: unknown
  search?: unknown
  rule?: unknown
  value?: unknown
  roundTo?: unknown
  minPrice?: unknown
  maxPrice?: unknown
  currencyRates?: unknown
  includeUnavailable?: unknown
}

function clean(value: unknown, max = 120) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function parseOptionalPositiveInt(value: unknown) {
  if (value == null || value === '') return null
  const number = Number(value)
  return Number.isSafeInteger(number) && number > 0 ? number : null
}

function parseRates(raw: unknown) {
  const rates: Record<string, number> = { MNT: 1 }
  if (!raw || typeof raw !== 'object') return rates
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const code = key.trim().toUpperCase().slice(0, 8)
    const rate = Number(value)
    if (code && Number.isFinite(rate) && rate > 0 && rate < 1_000_000_000) rates[code] = rate
  }
  return rates
}

function roundPrice(value: number, roundTo: number) {
  if (!Number.isFinite(value) || value <= 0) return null
  const step = roundTo === 1000 ? 1000 : roundTo === 100 ? 100 : 1
  return Math.max(step, Math.ceil(value / step) * step)
}

function clampPrice(value: number, minPrice: number | null, maxPrice: number | null) {
  let next = value
  if (minPrice != null) next = Math.max(next, minPrice)
  if (maxPrice != null) next = Math.min(next, maxPrice)
  return next
}

function calculateFromCurrent(current: number, rule: RuleType, value: number) {
  if (rule === 'percentage') return current * (1 + value / 100)
  if (rule === 'multiplier') return current * value
  if (rule === 'fixed') return current + value
  if (rule === 'direct') return value
  return null
}

export async function POST(req: NextRequest) {
  if (!getAdminFromRequest(req)) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })

  try {
    const body = await req.json() as BulkPriceBody
    const apply = body.apply === true
    const scope = (clean(body.scope, 20) || 'all') as ScopeType
    const rule = (clean(body.rule, 30) || 'percentage') as RuleType
    const value = Number(body.value)
    const roundTo = [1, 100, 1000].includes(Number(body.roundTo)) ? Number(body.roundTo) : 100
    const minPrice = parseOptionalPositiveInt(body.minPrice)
    const maxPrice = parseOptionalPositiveInt(body.maxPrice)
    const categoryId = clean(body.categoryId)
    const supplier = clean(body.supplier)
    const search = clean(body.search)
    const includeUnavailable = body.includeUnavailable === true
    const currencyRates = parseRates(body.currencyRates)

    if (!['all', 'category', 'supplier', 'search'].includes(scope)) {
      return NextResponse.json({ error: 'Үнэ өөрчлөх хүрээ буруу байна' }, { status: 400 })
    }
    if (!['percentage', 'multiplier', 'fixed', 'direct', 'sourceMarkup'].includes(rule)) {
      return NextResponse.json({ error: 'Үнэ бодох дүрэм буруу байна' }, { status: 400 })
    }
    if (!Number.isFinite(value)) {
      return NextResponse.json({ error: 'Үнэ бодох утга оруулна уу' }, { status: 400 })
    }
    if (rule === 'percentage' && (value < -99 || value > 1000)) {
      return NextResponse.json({ error: 'Хувийн өөрчлөлт -99%–1000% хооронд байна' }, { status: 400 })
    }
    if (rule === 'multiplier' && (value <= 0 || value > 20)) {
      return NextResponse.json({ error: 'Үржүүлэгч 0-оос их, 20-оос бага байна' }, { status: 400 })
    }
    if (rule === 'fixed' && (value < -100_000_000 || value > 100_000_000)) {
      return NextResponse.json({ error: 'Тогтмол өөрчлөлтийн дүн хэт их байна' }, { status: 400 })
    }
    if (rule === 'direct' && (!Number.isSafeInteger(value) || value <= 0)) {
      return NextResponse.json({ error: 'Шууд үнэ бүхэл эерэг ₮ дүн байна' }, { status: 400 })
    }
    if (rule === 'sourceMarkup' && (value < 0 || value > 1000)) {
      return NextResponse.json({ error: 'Source markup 0–1000% хооронд байна' }, { status: 400 })
    }
    if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
      return NextResponse.json({ error: 'Доод үнэ дээд үнээс их байж болохгүй' }, { status: 400 })
    }
    if (scope === 'category' && !categoryId) {
      return NextResponse.json({ error: 'Ангилал сонгоно уу' }, { status: 400 })
    }
    if (scope === 'supplier' && !supplier) {
      return NextResponse.json({ error: 'Supplier нэр оруулна уу' }, { status: 400 })
    }
    if (scope === 'search' && !search) {
      return NextResponse.json({ error: 'Хайх үг оруулна уу' }, { status: 400 })
    }

    let supplierProductIds: string[] | null = null
    if (scope === 'supplier') {
      const linked = await db.supplierCatalogItem.findMany({
        where: { supplier: { contains: supplier }, productId: { not: null } },
        select: { productId: true },
        take: 5000,
      })
      supplierProductIds = [...new Set(linked.map(item => item.productId).filter((id): id is string => Boolean(id)))]
      if (!supplierProductIds.length) {
        return NextResponse.json({
          ok: true,
          apply,
          stats: { matched: 0, changed: 0, unchanged: 0, skipped: 0, linkedSupplier: 0 },
          sample: [],
          missingRates: {},
        })
      }
    }

    const where: Prisma.ProductWhereInput = {}
    if (!includeUnavailable) where.available = true
    if (scope === 'category') where.categoryId = categoryId
    if (scope === 'supplier' && supplierProductIds) where.id = { in: supplierProductIds }
    if (scope === 'search') where.name = { contains: search }

    const products = await db.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        price: true,
        oldPrice: true,
        discount: true,
        categoryId: true,
        category: true,
        available: true,
      },
      orderBy: { name: 'asc' },
      take: 5000,
    })

    const productIds = products.map(product => product.id)
    const supplierItems = productIds.length
      ? await db.supplierCatalogItem.findMany({
          where: { productId: { in: productIds } },
          orderBy: { updatedAt: 'desc' },
        })
      : []

    const supplierByProduct = new Map<string, typeof supplierItems>()
    for (const item of supplierItems) {
      if (!item.productId) continue
      const list = supplierByProduct.get(item.productId) || []
      list.push(item)
      supplierByProduct.set(item.productId, list)
    }

    const missingRates = new Map<string, number>()
    const changes: Array<{
      id: string
      name: string
      category: string
      oldPrice: number
      newPrice: number
      delta: number
      deltaPercent: number
      supplier: string | null
      sourcePrice: number | null
      sourceCurrency: string | null
      supplierItemId: string | null
    }> = []
    let skipped = 0

    for (const product of products) {
      const linked = supplierByProduct.get(product.id) || []
      const sourceItem = linked.find(item => item.sourcePrice != null && item.sourcePrice > 0) || linked[0] || null
      let raw: number | null = null

      if (rule === 'sourceMarkup') {
        if (!sourceItem?.sourcePrice) {
          skipped += 1
          continue
        }
        const code = (sourceItem.sourceCurrency || 'MNT').trim().toUpperCase()
        const rate = currencyRates[code]
        if (!rate) {
          missingRates.set(code, (missingRates.get(code) || 0) + 1)
          skipped += 1
          continue
        }
        raw = sourceItem.sourcePrice * rate * (1 + value / 100)
      } else {
        raw = calculateFromCurrent(product.price, rule, value)
      }

      if (raw == null) {
        skipped += 1
        continue
      }

      const rounded = roundPrice(clampPrice(raw, minPrice, maxPrice), roundTo)
      if (!rounded) {
        skipped += 1
        continue
      }

      const delta = rounded - product.price
      const deltaPercent = product.price > 0 ? (delta / product.price) * 100 : 0
      changes.push({
        id: product.id,
        name: product.name,
        category: product.category,
        oldPrice: product.price,
        newPrice: rounded,
        delta,
        deltaPercent,
        supplier: sourceItem?.supplier || null,
        sourcePrice: sourceItem?.sourcePrice ?? null,
        sourceCurrency: sourceItem?.sourceCurrency ?? null,
        supplierItemId: sourceItem?.id || null,
      })
    }

    const changed = changes.filter(item => item.oldPrice !== item.newPrice)

    if (apply && changed.length) {
      for (let start = 0; start < changed.length; start += 25) {
        const chunk = changed.slice(start, start + 25)
        await Promise.all(chunk.map(async change => {
          const current = products.find(product => product.id === change.id)
          if (!current) return
          const nextDiscount = current.oldPrice && current.oldPrice > change.newPrice
            ? Math.max(1, Math.round(((current.oldPrice - change.newPrice) / current.oldPrice) * 100))
            : null

          await db.product.update({
            where: { id: change.id },
            data: {
              price: change.newPrice,
              oldPrice: nextDiscount ? current.oldPrice : null,
              discount: nextDiscount,
            },
          })

          const linked = supplierByProduct.get(change.id) || []
          if (linked.length) {
            await Promise.all(linked.map(item => db.supplierCatalogItem.update({
              where: { id: item.id },
              data: {
                salePrice: change.newPrice,
                ...(rule === 'sourceMarkup' ? { markupPercent: value } : {}),
              },
            })))
          }
        }))
      }
    }

    return NextResponse.json({
      ok: true,
      apply,
      scope,
      rule,
      value,
      roundTo,
      stats: {
        matched: products.length,
        changed: changed.length,
        unchanged: changes.length - changed.length,
        skipped,
        linkedSupplier: changes.filter(item => item.supplier).length,
      },
      missingRates: Object.fromEntries(missingRates),
      sample: changed.slice(0, 30),
    })
  } catch (error) {
    console.error('Bulk pricing error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Бөөнөөр үнэ шинэчлэхэд алдаа гарлаа' }, { status: 500 })
  }
}
