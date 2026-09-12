import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

function safeSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function features(item: { supplier: string; brandName: string | null; regionName: string | null; serviceName: string }) {
  return [
    item.brandName ? `Брэнд/Платформ: ${item.brandName}` : null,
    item.regionName ? `Бүс: ${item.regionName}` : null,
    `Төрөл: ${item.serviceName}`,
    `Нийлүүлэгч: ${item.supplier}`,
  ].filter(Boolean).join(';')
}

function categorySlugFor(item: { supplier: string; serviceName: string }) {
  const category = safeSlug(item.serviceName) || 'catalog'
  if (item.supplier === 'G2G') return `supplier-${category}`
  return `supplier-${safeSlug(item.supplier) || 'csv'}-${category}`.slice(0, 100)
}

function productSlugFor(item: { supplier: string; externalId: string; id: string }) {
  const external = safeSlug(item.externalId) || item.id.toLowerCase()
  if (item.supplier === 'G2G') return `g2g-${external}`.slice(0, 100)
  if (item.supplier === 'G2A') return `g2a-${external}`.slice(0, 100)
  return `supplier-${safeSlug(item.supplier) || 'csv'}-${external}`.slice(0, 100)
}

function safeG2AImage(item: { supplier: string; metadata: string | null }) {
  if (item.supplier !== 'G2A' || !item.metadata) return null
  try {
    const parsed = JSON.parse(item.metadata) as {
      product?: { portraitImage?: unknown; coverImage?: unknown; thumbnail?: unknown } | null
    }
    const candidates = [parsed.product?.portraitImage, parsed.product?.coverImage, parsed.product?.thumbnail]
    for (const candidate of candidates) {
      if (typeof candidate !== 'string') continue
      const url = new URL(candidate)
      if (url.protocol === 'https:' && url.hostname === 'images.g2a.com') return url.toString()
    }
  } catch {}
  return null
}

export async function POST(req: NextRequest) {
  if (!getAdminFromRequest(req)) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })

  try {
    const body = await req.json() as { ids?: unknown; allPriced?: unknown; limit?: unknown }
    const ids = Array.isArray(body.ids) ? body.ids.filter((id): id is string => typeof id === 'string').slice(0, 500) : []
    const limit = Math.min(500, Math.max(1, Number(body.limit) || 250))
    const allPriced = body.allPriced === true
    if (!ids.length && !allPriced) return NextResponse.json({ error: 'Нийтлэх бүтээгдэхүүн сонгоно уу' }, { status: 400 })

    const items = await db.supplierCatalogItem.findMany({
      where: ids.length
        ? { id: { in: ids }, salePrice: { gt: 0 } }
        : { salePrice: { gt: 0 }, published: false },
      orderBy: { updatedAt: 'asc' },
      take: ids.length ? ids.length : limit,
    })

    let created = 0
    let updated = 0
    const errors: Array<{ id: string; error: string }> = []

    for (const item of items) {
      try {
        if (!item.salePrice || item.salePrice <= 0) continue
        const categoryName = item.serviceName || `${item.supplier} Catalog`
        const categorySlug = categorySlugFor({ supplier: item.supplier, serviceName: categoryName })
        const category = await db.category.upsert({
          where: { slug: categorySlug },
          update: { name: categoryName },
          create: {
            name: categoryName,
            slug: categorySlug,
            icon: categoryName.toLowerCase().includes('gift') ? 'Gift' : 'Package',
            description: `${item.supplier} нийлүүлэгчийн каталогоос оруулсан бүтээгдэхүүнүүд`,
            order: 100,
          },
        })

        const shortDesc = [item.brandName, item.regionName].filter(Boolean).join(' · ') || `${item.serviceName} бүтээгдэхүүн`
        const image = safeG2AImage(item)
        const productData = {
          name: item.name,
          shortDesc,
          description: `${item.name}. ${item.supplier} supplier catalog-аас оруулсан бүтээгдэхүүн. Худалдан авахаасаа өмнө бүс, платформ болон хүргэлтийн нөхцөлийг шалгана уу.`,
          price: item.salePrice,
          category: category.name,
          categoryId: category.id,
          icon: categoryName.toLowerCase().includes('gift') ? 'Gift' : 'Package',
          ...(image ? { image } : {}),
          available: item.available,
          deliveryInfo: item.supplier === 'G2A' ? 'G2A Export API захиалгын дараа хүргэнэ' : 'Захиалгын дараа боловсруулна',
          features: features(item),
        }

        let product = item.productId ? await db.product.findUnique({ where: { id: item.productId } }) : null
        if (product) {
          product = await db.product.update({ where: { id: product.id }, data: productData })
          updated += 1
        } else {
          const slug = productSlugFor(item)
          const bySlug = await db.product.findUnique({ where: { slug } })
          product = bySlug
            ? await db.product.update({ where: { id: bySlug.id }, data: productData })
            : await db.product.create({ data: { ...productData, slug } })
          if (bySlug) updated += 1
          else created += 1
        }

        await db.supplierCatalogItem.update({
          where: { id: item.id },
          data: { published: true, productId: product.id },
        })
      } catch (error) {
        errors.push({ id: item.id, error: error instanceof Error ? error.message : 'Нийтлэх алдаа' })
      }
    }

    const remaining = allPriced
      ? await db.supplierCatalogItem.count({ where: { salePrice: { gt: 0 }, published: false } })
      : 0

    return NextResponse.json({ ok: true, created, updated, errors, processed: items.length, remaining })
  } catch (error) {
    console.error('Supplier publish error:', error)
    return NextResponse.json({ error: 'Supplier бүтээгдэхүүн нийтлэхэд алдаа гарлаа' }, { status: 500 })
  }
}
