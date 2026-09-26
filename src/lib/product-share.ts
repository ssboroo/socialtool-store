import { licenseVariants } from '@/lib/license'

type ShareProduct = { id: string; name: string; shortDesc: string; price: number; duration?: string | null }
export function productShareUrl(id: string, origin: string) {
  return new URL('/share/product/' + encodeURIComponent(id), origin).href
}
export function productShareText(p: ShareProduct, origin: string) {
  const money = (value: number) => value === 0 ? 'Үнэгүй' : value.toLocaleString('en-US') + ' ₮'
  const variants = licenseVariants(p.duration)
  const price = variants.length ? variants.map(v => v.term + ': ' + money(v.price ?? p.price)).join('\n') : money(p.price)
  return [p.name, p.shortDesc, price, 'Дэлгэрэнгүй: ' + productShareUrl(p.id, origin)].filter(Boolean).join('\n\n')
}
export function publicProductImage(image: string | null | undefined, origin: string) {
  if (!image) return null
  try {
    const url = new URL(image, origin)
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null
  } catch { return null }
}
