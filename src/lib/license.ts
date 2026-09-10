export const LICENSE_TERMS = ['1 жил', 'Хугацаагүй'] as const
export type LicenseTerm = string
export function validTerm(value: unknown): value is LicenseTerm {
  return typeof value === 'string' && value.length <= 80
}
export function licenseOptions(value?: string | null): string[] {
  return [...new Set((value || '').split(';').map(s => s.trim()).filter(Boolean))]
}
export function cartKey(item: { id: string; duration?: string }) {
  return JSON.stringify([item.id, item.duration || ''])
}
