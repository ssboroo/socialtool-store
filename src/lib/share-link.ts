export function productPath(id: string) {
  return `/share/product/${encodeURIComponent(id)}`
}
export function facebookShareUrl(url: string) {
  return `https://www.facebook.com/sharer/sharer.php?${new URLSearchParams({ u: url })}`
}
// Social crawlers fetch remote images themselves. Never fetch arbitrary URLs on our server.
export function externalShareImage(image?: string | null): string | null {
  if (!image) return null
  try {
    const url = new URL(image)
    if (url.protocol !== 'https:' || url.username || url.password) return null
    if (!url.hostname.includes('.') || url.hostname.endsWith('.localhost') || /^[\d.]+$/.test(url.hostname) || url.hostname.includes(':')) return null
    return url.href
  } catch { return null }
}
