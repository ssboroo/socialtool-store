export const LICENSE_TERMS = ['1 жил', 'Хугацаагүй'] as const
export type LicenseTerm = string
export function validTerm(value: unknown): value is LicenseTerm {
  return typeof value === 'string' && value.length <= 80
}
export function licenseOptions(value?: string | null): string[] {
  return licenseVariants(value).map(v => v.term)
}
export function cartKey(item: { id: string; duration?: string }) {
  return JSON.stringify([item.id, item.duration || ''])
}

export function licenseVariants(value?: string | null): { term: string; price?: number }[] {
  if (!value) return []
  if (value.startsWith('[')) {
    try { const rows = JSON.parse(value); if (Array.isArray(rows)) return rows.filter(v => v && validTerm(v.term) && v.term.trim() && (v.price === undefined || (Number.isSafeInteger(v.price) && v.price > 0))).map(v => ({ term: v.term.trim(), price: v.price })) } catch {}
    return []
  }
  return [...new Set(value.split(';').map(s => s.trim()).filter(s => s && !/^\d*\s*ширхэг$/i.test(s)))].map(term => ({ term }))
}
export function licensePrice(product: { price: number; duration?: string | null }, term: string) {
  return licenseVariants(product.duration).find(v => v.term === term)?.price ?? product.price
}
export function validLicenseConfig(value: unknown) {
  if (value == null || value === '') return true
  if (typeof value !== 'string' || value.length > 2000) return false
  if (!value.startsWith('[')) return value.split(';').every(validTerm)
  try { const rows = JSON.parse(value); return Array.isArray(rows) && rows.length <= 10 && rows.every(v => v && validTerm(v.term) && v.term.trim() && Number.isSafeInteger(v.price) && v.price > 0) && new Set(rows.map(v => v.term.trim())).size === rows.length } catch { return false }
}
