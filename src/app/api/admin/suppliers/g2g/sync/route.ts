import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'
import { getG2GProducts, g2gConfigured } from '@/lib/g2g'

function clean(value: unknown, max = 180) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export async function POST(req: NextRequest) {
  if (!getAdminFromRequest(req)) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })
  if (!g2gConfigured()) return NextResponse.json({ error: 'G2G API key тохируулаагүй байна' }, { status: 409 })

  try {
    const body = await req.json() as Record<string, unknown>
    const serviceId = clean(body.serviceId)
    const serviceName = clean(body.serviceName) || 'G2G'
    const brandId = clean(body.brandId)
    const brandName = clean(body.brandName) || 'G2G'
    const categoryId = clean(body.categoryId) || undefined
    const categoryName = clean(body.categoryName) || null
    if (!serviceId || !brandId) return NextResponse.json({ error: 'serviceId болон brandId шаардлагатай' }, { status: 400 })

    const products = await getG2GProducts(serviceId, brandId, categoryId)
    const now = new Date()
    let synced = 0

    for (let start = 0; start < products.length; start += 100) {
      const chunk = products.slice(start, start + 100)
      await db.$transaction(chunk.map(product => db.supplierCatalogItem.upsert({
        where: { supplier_externalId: { supplier: 'G2G', externalId: product.product_id } },
        update: {
          serviceId,
          serviceName: clean(product.service_name) || serviceName,
          categoryId: categoryId || null,
          categoryName,
          brandId,
          brandName: clean(product.brand_name) || brandName,
          regionName: clean(product.region_name, 80) || null,
          name: clean(product.product_name, 300) || `${brandName} ${product.product_id}`,
          metadata: JSON.stringify(product),
          lastSyncedAt: now,
        },
        create: {
          supplier: 'G2G',
          externalId: product.product_id,
          serviceId,
          serviceName: clean(product.service_name) || serviceName,
          categoryId: categoryId || null,
          categoryName,
          brandId,
          brandName: clean(product.brand_name) || brandName,
          regionName: clean(product.region_name, 80) || null,
          name: clean(product.product_name, 300) || `${brandName} ${product.product_id}`,
          markupPercent: 15,
          metadata: JSON.stringify(product),
          lastSyncedAt: now,
        },
      })))
      synced += chunk.length
    }

    return NextResponse.json({ ok: true, synced, brandId, brandName })
  } catch (error) {
    console.error('G2G brand sync error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'G2G бүтээгдэхүүн sync хийхэд алдаа гарлаа' }, { status: 502 })
  }
}
