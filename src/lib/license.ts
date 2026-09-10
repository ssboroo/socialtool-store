export const LICENSE_TERMS = ['1 жил', 'Хугацаагүй'] as const
export type LicenseTerm = typeof LICENSE_TERMS[number]
export function validTerm(value: unknown): value is LicenseTerm {
  return value === '1 жил' || value === 'Хугацаагүй'
}
export function cartKey(item: { id: string; duration?: string }) {
  return JSON.stringify([item.id, item.duration || 'Хугацаагүй'])
}
