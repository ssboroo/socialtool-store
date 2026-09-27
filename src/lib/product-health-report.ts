import { db } from '@/lib/db'
import { inspectProducts } from '@/lib/product-health'

export async function productHealthReport() {
  const [products, categories, uploads] = await Promise.all([
    db.product.findMany({
      select: {
        id: true, name: true, slug: true, shortDesc: true, description: true,
        category: true, categoryId: true, price: true, oldPrice: true,
        image: true, icon: true, downloadUrl: true, requiresOrderLink: true,
        tutorialVideoUrl: true, available: true,
      },
    }),
    db.category.findMany({ select: { id: true } }),
    db.uploadedImage.findMany({ select: { filename: true } }),
  ])
  const issues = inspectProducts(
    products,
    new Set(categories.map(item => item.id)),
    new Set(uploads.map(item => item.filename)),
  )
  return {
    scannedAt: new Date().toISOString(),
    productCount: products.length,
    affectedCount: new Set(issues.map(row => row.productId)).size,
    totals: {
      critical: issues.filter(row => row.severity === 'critical').length,
      warning: issues.filter(row => row.severity === 'warning').length,
      info: issues.filter(row => row.severity === 'info').length,
    },
    issues,
  }
}
