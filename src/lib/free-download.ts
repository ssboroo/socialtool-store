// undefined means invalid input; null means this is a paid product without a public download.
export function parseDownloadUrl(value: unknown): string | null | undefined {
  if (value == null || value === '') return null
  if (typeof value !== 'string' || value.trim().length > 2000) return undefined
  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) return undefined
    return url.href
  } catch { return undefined }
}

export function validProductOffer(price: number, downloadUrl: string | null, duration: unknown, oldPrice: number | null): boolean {
  if (!Number.isSafeInteger(price) || price < 0 || price > 2147483647) return false
  return downloadUrl ? price === 0 && !duration && oldPrice === null : price > 0
}

export function freeDownloadUrl(product: { price: number; downloadUrl?: string | null; available: boolean }): string | null {
  return product.available && product.price === 0 ? parseDownloadUrl(product.downloadUrl) || null : null
}
