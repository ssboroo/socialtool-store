import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'
import { getG2GBrands, getG2GServices, g2gConfigured } from '@/lib/g2g'

const CONFIG_KEY = 'supplier:g2g:config'
const DEFAULT_CONFIG = { markupPercent: 15, currencyRates: { MNT: 1 } as Record<string, number> }

async function readConfig() {
  const setting = await db.siteSetting.findUnique({ where: { key: CONFIG_KEY } })
  if (!setting) return DEFAULT_CONFIG
  try {
    const value = JSON.parse(setting.value) as { markupPercent?: unknown; currencyRates?: unknown }
    const markupPercent = typeof value.markupPercent === 'number' && Number.isFinite(value.markupPercent)
      ? Math.min(300, Math.max(0, value.markupPercent))
      : DEFAULT_CONFIG.markupPercent
    const currencyRates: Record<string, number> = { MNT: 1 }
    if (value.currencyRates && typeof value.currencyRates === 'object') {
      for (const [currency, raw] of Object.entries(value.currencyRates as Record<string, unknown>)) {
        const rate = Number(raw)
        const code = currency.trim().toUpperCase().slice(0, 8)
        if (code && Number.isFinite(rate) && rate > 0 && rate < 1_000_000_000) currencyRates[code] = rate
      }
    }
    return { markupPercent, currencyRates }
  } catch {
    return DEFAULT_CONFIG
  }
}

export async function GET(req: NextRequest) {
  if (!getAdminFromRequest(req)) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })

  try {
    const remote = req.nextUrl.searchParams.get('remote')
    if (remote === 'services') {
      if (!g2gConfigured()) return NextResponse.json({ error: 'G2G API key тохируулаагүй байна' }, { status: 409 })
      const services = await getG2GServices()
      return NextResponse.json({ services })
    }
    if (remote === 'brands') {
      if (!g2gConfigured()) return NextResponse.json({ error: 'G2G API key тохируулаагүй байна' }, { status: 409 })
      const serviceId = req.nextUrl.searchParams.get('serviceId')?.trim()
      if (!serviceId) return NextResponse.json({ error: 'serviceId шаардлагатай' }, { status: 400 })
      const after = req.nextUrl.searchParams.get('after') || undefined
      const q = req.nextUrl.searchParams.get('q') || undefined
      const result = await getG2GBrands(serviceId, after, q)
      return NextResponse.json(result)
    }

    const q = (req.nextUrl.searchParams.get('q') || '').trim().slice(0, 120)
    const page = Math.max(1, Number(req.nextUrl.searchParams.get('page') || 1) || 1)
    const limit = Math.min(100, Math.max(10, Number(req.nextUrl.searchParams.get('limit') || 50) || 50))
    const where = {
      supplier: 'G2G',
      ...(q ? {
        OR: [
          { name: { contains: q } },
          { brandName: { contains: q } },
          { serviceName: { contains: q } },
          { regionName: { contains: q } },
          { externalId: { contains: q } },
        ],
      } : {}),
    }

    const [items, total, priced, published, available, latest, config] = await Promise.all([
      db.supplierCatalogItem.findMany({ where, orderBy: [{ serviceName: 'asc' }, { brandName: 'asc' }, { name: 'asc' }], skip: (page - 1) * limit, take: limit }),
      db.supplierCatalogItem.count({ where: { supplier: 'G2G' } }),
      db.supplierCatalogItem.count({ where: { supplier: 'G2G', salePrice: { gt: 0 } } }),
      db.supplierCatalogItem.count({ where: { supplier: 'G2G', published: true } }),
      db.supplierCatalogItem.count({ where: { supplier: 'G2G', available: true } }),
      db.supplierCatalogItem.findFirst({ where: { supplier: 'G2G' }, orderBy: { lastSyncedAt: 'desc' }, select: { lastSyncedAt: true } }),
      readConfig(),
    ])

    return NextResponse.json({
      configured: g2gConfigured(),
      requiredEnv: ['G2G_API_KEY', 'G2G_SECRET_KEY', 'G2G_USER_ID'],
      config,
      stats: { total, priced, published, available, lastSyncedAt: latest?.lastSyncedAt || null },
      items,
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    })
  } catch (error) {
    console.error('G2G supplier GET error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'G2G каталог уншихад алдаа гарлаа' }, { status: 502 })
  }
}

export async function PATCH(req: NextRequest) {
  if (!getAdminFromRequest(req)) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })
  try {
    const body = await req.json() as { markupPercent?: unknown; currencyRates?: unknown }
    const markupPercent = Number(body.markupPercent)
    if (!Number.isFinite(markupPercent) || markupPercent < 0 || markupPercent > 300) {
      return NextResponse.json({ error: 'Markup 0–300% хооронд байна' }, { status: 400 })
    }
    const currencyRates: Record<string, number> = { MNT: 1 }
    if (body.currencyRates && typeof body.currencyRates === 'object') {
      for (const [currency, raw] of Object.entries(body.currencyRates as Record<string, unknown>)) {
        const rate = Number(raw)
        const code = currency.trim().toUpperCase().slice(0, 8)
        if (!code || !Number.isFinite(rate) || rate <= 0 || rate >= 1_000_000_000) continue
        currencyRates[code] = rate
      }
    }
    const config = { markupPercent, currencyRates }
    await db.siteSetting.upsert({ where: { key: CONFIG_KEY }, update: { value: JSON.stringify(config) }, create: { key: CONFIG_KEY, value: JSON.stringify(config) } })
    return NextResponse.json({ ok: true, config })
  } catch {
    return NextResponse.json({ error: 'Тохиргооны өгөгдөл буруу байна' }, { status: 400 })
  }
}
