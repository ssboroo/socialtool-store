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

function features(item: { brandName: string | null; regionName: string | null; serviceName: string }) {
  return [
    item.brandName ? `Брэнд: ${item.brandName}` : null,
    item.regionName ? `Бүс: ${item.regionName}` : null,
    `Төрөл: ${item.serviceName}`,
    'Каталог: G2G',
  ].filter(Boolean).join(';')
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
        ? { supplier: 'G2G', id: { in: ids }, salePrice: { gt: 0 } }
        : { supplier: 'G2G', salePrice: { gt: 0 }, published: false },
      orderBy: { updatedAt: 'asc' },
      take: ids.length ? ids.length : limit,
    })

    let created = 0
    let updated = 0
    const errors: Array<{ id: string; error: string }> = []

    for (const item of items) {
      try {
        if (!item.salePrice || item.salePrice <= 0) continue
        const categoryName = item.serviceName || 'G2G Catalog'
        const categorySlug = `supplier-${safeSlug(categoryName) || 'g2g'}`
        const category = await db.category.upsert({
          where: { slug: categorySlug },
          update: { name: categoryName },
          create: {
            name: categoryName,
            slug: categorySlug,
            icon: categoryName.toLowerCase().includes('gift') ? 'Gift' : 'Package',
            description: 'Нийлүүлэгчийн каталогоос синк хийсэн бүтээгдэхүүнүүд',
            order: 100,
          },
        })

        const shortDesc = [item.brandName, item.regionName].filter(Boolean).join(' · ') || `${item.serviceName} бүтээгдэхүүн`
        const productData = {
          name: item.name,
          shortDesc,
          description: `${item.name}. G2G supplier catalog-аас синк хийсэн бүтээгдэхүүн. Худалдан авахаасаа өмнө бүс, платформ болон хүргэлтийн нөхцөлийг шалгана уу.`,
          price: item.salePrice,
          category: category.name,
          categoryId: category.id,
          icon: categoryName.toLowerCase().includes('gift') ? 'Gift' : 'Package',
          available: item.available,
          deliveryInfo: 'Захиалгын дараа боловсруулна',
          features: features(item),
        }

        let product = item.productId ? await db.product.findUnique({ where: { id: item.productId } }) : null
        if (product) {
          product = await db.product.update({ where: { id: product.id }, data: productData })
          updated += 1
        } else {
          const slug = `g2g-${safeSlug(item.externalId) || item.id.toLowerCase()}`.slice(0, 100)
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
      ? await db.supplierCatalogItem.count({ where: { supplier: 'G2G', salePrice: { gt: 0 }, published: false } })
      : 0

    return NextResponse.json({ ok: true, created, updated, errors, processed: items.length, remaining })
  } catch (error) {
    console.error('Supplier publish error:', error)
    return NextResponse.json({ error: 'Supplier бүтээгдэхүүн нийтлэхэд алдаа гарлаа' }, { status: 500 })
  }
}
