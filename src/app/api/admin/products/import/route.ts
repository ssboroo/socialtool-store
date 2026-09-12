import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'
import { validLicenseConfig } from '@/lib/license'

type ImportMode = 'skip' | 'update' | 'create'

type ImportRow = {
  name?: unknown
  category?: unknown
  categoryId?: unknown
  price?: unknown
  oldPrice?: unknown
  shortDesc?: unknown
  description?: unknown
  icon?: unknown
  image?: unknown
  features?: unknown
  duration?: unknown
  tutorialVideoUrl?: unknown
  instructionImages?: unknown
  available?: unknown
  featured?: unknown
}

function cleanText(value: unknown, max: number, required = false) {
  if (value == null || value === '') return required ? null : ''
  if (typeof value !== 'string') return null
  const out = value.trim()
  if ((required && !out) || out.length > max) return null
  return out
}

function boolValue(value: unknown, fallback: boolean) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['1', 'true', 'yes', 'y', 'тийм', 'бэлэн', 'on'].includes(normalized)) return true
    if (['0', 'false', 'no', 'n', 'үгүй', 'дууссан', 'off'].includes(normalized)) return false
  }
  return fallback
}

function numberValue(value: unknown) {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim()) return Number(value.replace(/[₮,\s]/g, ''))
  return NaN
}

function slugBase(name: string) {
  return name.toLowerCase().replace(/[^\w\u0400-\u04FF]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 72) || 'product'
}

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })

  try {
    const body = await req.json() as { rows?: unknown; mode?: unknown }
    if (!Array.isArray(body.rows) || body.rows.length === 0 || body.rows.length > 300) {
      return NextResponse.json({ error: '1-300 бүтээгдэхүүн нэг удаад импортлоно уу' }, { status: 400 })
    }
    const mode: ImportMode = body.mode === 'update' || body.mode === 'create' ? body.mode : 'skip'
    const categories = await db.category.findMany({ select: { id: true, name: true, slug: true } })
    const byId = new Map(categories.map(c => [c.id, c]))
    const byName = new Map<string, (typeof categories)[number]>()
    for (const category of categories) {
      byName.set(category.name.trim().toLowerCase(), category)
      byName.set(category.slug.trim().toLowerCase(), category)
    }

    const results: { row: number; name: string; status: 'created' | 'updated' | 'skipped' | 'error'; error?: string }[] = []

    for (let index = 0; index < body.rows.length; index++) {
      const raw = body.rows[index]
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        results.push({ row: index + 2, name: '', status: 'error', error: 'Мөрийн бүтэц буруу' })
        continue
      }
      const row = raw as ImportRow
      const name = cleanText(row.name, 160, true)
      const categoryText = cleanText(row.category, 100)
      const categoryIdText = cleanText(row.categoryId, 120)
      const shortDesc = cleanText(row.shortDesc, 500)
      const description = cleanText(row.description, 20000)
      const icon = cleanText(row.icon, 80)
      const image = cleanText(row.image, 1000)
      const features = cleanText(row.features, 5000)
      const tutorialVideoUrl = cleanText(row.tutorialVideoUrl, 1000)
      const instructionImages = cleanText(row.instructionImages, 10000)
      const duration = row.duration == null || row.duration === '' ? null : row.duration
      const price = numberValue(row.price)
      const oldPrice = row.oldPrice == null || row.oldPrice === '' ? null : numberValue(row.oldPrice)

      if (!name) {
        results.push({ row: index + 2, name: '', status: 'error', error: 'Нэр шаардлагатай' })
        continue
      }
      const category = (categoryIdText ? byId.get(categoryIdText) : undefined) || (categoryText ? byName.get(categoryText.toLowerCase()) : undefined)
      if (!category) {
        results.push({ row: index + 2, name, status: 'error', error: `Ангилал олдсонгүй: ${categoryText || categoryIdText || '-'}` })
        continue
      }
      if (
        shortDesc === null || description === null || icon === null || image === null || features === null ||
        tutorialVideoUrl === null || instructionImages === null || !Number.isSafeInteger(price) || price <= 0 ||
        !validLicenseConfig(duration) || (oldPrice !== null && (!Number.isSafeInteger(oldPrice) || oldPrice <= price))
      ) {
        results.push({ row: index + 2, name, status: 'error', error: 'Үнэ, хугацаа эсвэл текст талбарын утга буруу' })
        continue
      }

      const existing = await db.product.findFirst({ where: { name }, select: { id: true } })
      if (existing && mode === 'skip') {
        results.push({ row: index + 2, name, status: 'skipped' })
        continue
      }

      const data = {
        name,
        shortDesc: shortDesc || '',
        description: description || shortDesc || '',
        price,
        oldPrice,
        discount: oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : null,
        icon: icon || 'Package',
        image: image || null,
        category: category.name,
        categoryId: category.id,
        available: boolValue(row.available, true),
        featured: boolValue(row.featured, false),
        features: features || null,
        duration: typeof duration === 'string' ? duration : null,
        tutorialVideoUrl: tutorialVideoUrl || null,
        instructionImages: instructionImages || null,
      }

      try {
        if (existing && mode === 'update') {
          await db.product.update({ where: { id: existing.id }, data })
          results.push({ row: index + 2, name, status: 'updated' })
        } else {
          const suffix = `${Date.now().toString(36)}-${index.toString(36)}`
          await db.product.create({ data: { ...data, slug: `${slugBase(name)}-${suffix}`, rating: 5, reviewCount: 0 } })
          results.push({ row: index + 2, name, status: 'created' })
        }
      } catch (error) {
        console.error('Bulk product row failed', { row: index + 2, type: error instanceof Error ? error.name : 'unknown' })
        results.push({ row: index + 2, name, status: 'error', error: 'Өгөгдлийн санд хадгалж чадсангүй' })
      }
    }

    const summary = {
      total: results.length,
      created: results.filter(r => r.status === 'created').length,
      updated: results.filter(r => r.status === 'updated').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      errors: results.filter(r => r.status === 'error').length,
    }
    return NextResponse.json({ ok: summary.errors === 0, summary, results })
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Хүсэлтийн бүтэц буруу байна' }, { status: 400 })
    console.error('Bulk product import error:', error instanceof Error ? error.name : 'unknown')
    return NextResponse.json({ error: 'Бөөн импорт хийхэд алдаа гарлаа' }, { status: 500 })
  }
}
