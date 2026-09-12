import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

const CONFIG_KEY = 'supplier:g2g:config'

type ImportRow = {
  externalId?: unknown
  name?: unknown
  serviceName?: unknown
  brandName?: unknown
  regionName?: unknown
  sourcePrice?: unknown
  sourceCurrency?: unknown
  salePrice?: unknown
  markupPercent?: unknown
  available?: unknown
}

function text(value: unknown, max = 300) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function bool(value: unknown, fallback = true) {
  if (typeof value === 'boolean') return value
  const normalized = String(value ?? '').trim().toLowerCase()
  if (!normalized) return fallback
  return !['false', '0', 'no', 'off', 'үгүй'].includes(normalized)
}

async function config() {
  const setting = await db.siteSetting.findUnique({ where: { key: CONFIG_KEY } })
  let markupPercent = 15
  const currencyRates: Record<string, number> = { MNT: 1 }
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

function roundSalePrice(value: number) {
  if (!Number.isFinite(value) || value <= 0) return null
  return Math.max(100, Math.ceil(value / 100) * 100)
}

export async function POST(req: NextRequest) {
  if (!getAdminFromRequest(req)) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })

  try {
    const body = await req.json() as { rows?: ImportRow[] }
    const rows = Array.isArray(body.rows) ? body.rows.slice(0, 1000) : []
    if (!rows.length) return NextResponse.json({ error: 'Импортын мөр олдсонгүй' }, { status: 400 })
    const settings = await config()
    const results: Array<{ row: number; status: 'updated' | 'created' | 'error'; error?: string }> = []

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index]
      try {
        const externalId = text(row.externalId, 180)
        if (!externalId) throw new Error('externalId дутуу')
        const existing = await db.supplierCatalogItem.findUnique({ where: { supplier_externalId: { supplier: 'G2G', externalId } } })
        const rowName = text(row.name)
        if (!existing && !rowName) throw new Error('Шинэ мөрт name шаардлагатай')

        const sourceCurrency = (text(row.sourceCurrency, 8) || existing?.sourceCurrency || 'MNT').toUpperCase()
        const sourcePrice = row.sourcePrice === '' || row.sourcePrice == null ? existing?.sourcePrice ?? null : Number(row.sourcePrice)
        const markupRaw = row.markupPercent === '' || row.markupPercent == null ? existing?.markupPercent ?? settings.markupPercent : Number(row.markupPercent)
        const markupPercent = Number.isFinite(markupRaw) && markupRaw >= 0 && markupRaw <= 300 ? markupRaw : settings.markupPercent
        const directSale = row.salePrice === '' || row.salePrice == null ? null : Number(row.salePrice)

        let salePrice: number | null = directSale && Number.isFinite(directSale) && directSale > 0 ? roundSalePrice(directSale) : null
        if (!salePrice && sourcePrice != null) {
          if (!Number.isFinite(sourcePrice) || sourcePrice <= 0) throw new Error('sourcePrice буруу')
          const rate = settings.currencyRates[sourceCurrency]
          if (!rate) throw new Error(`${sourceCurrency} ханш тохируулаагүй байна`)
          salePrice = roundSalePrice(sourcePrice * rate * (1 + markupPercent / 100))
        }
        if (!salePrice) throw new Error('salePrice эсвэл sourcePrice шаардлагатай')

        const data = {
          sourceCurrency,
          sourcePrice,
          markupPercent,
          salePrice,
          available: bool(row.available, existing?.available ?? true),
          lastSyncedAt: new Date(),
          ...(rowName ? { name: rowName } : {}),
          ...(text(row.serviceName, 180) ? { serviceName: text(row.serviceName, 180) } : {}),
          ...(text(row.brandName, 180) ? { brandName: text(row.brandName, 180) } : {}),
          ...(text(row.regionName, 80) ? { regionName: text(row.regionName, 80) } : {}),
        }

        if (existing) {
          await db.supplierCatalogItem.update({ where: { id: existing.id }, data })
          results.push({ row: index + 2, status: 'updated' })
        } else {
          await db.supplierCatalogItem.create({ data: {
            supplier: 'G2G',
            externalId,
            serviceName: text(row.serviceName, 180) || 'G2G Catalog',
            brandName: text(row.brandName, 180) || null,
            regionName: text(row.regionName, 80) || null,
            name: rowName,
            ...data,
          } })
          results.push({ row: index + 2, status: 'created' })
        }
      } catch (error) {
        results.push({ row: index + 2, status: 'error', error: error instanceof Error ? error.message : 'Импортын алдаа' })
      }
    }

    return NextResponse.json({
      ok: true,
      summary: {
        created: results.filter(r => r.status === 'created').length,
        updated: results.filter(r => r.status === 'updated').length,
        errors: results.filter(r => r.status === 'error').length,
      },
      results,
    })
  } catch {
    return NextResponse.json({ error: 'Импортын JSON буруу байна' }, { status: 400 })
  }
}
