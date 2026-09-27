import { detectProductBrandName } from './product-brand'
import { detectGameBrand } from './game-brand'

export type SearchableProduct = {
  id: string
  name: string
  category: string
  shortDesc: string
  description?: string | null
  searchKeywords?: string | null
  featured?: boolean
  available?: boolean
}

export function normalizeSearch(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase()
    .replace(/[‐‑‒–—―_]/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ').trim()
}

/** Bounded edit distance for typo tolerance, only for words of similar length. */
export function nearWord(a: string, b: string): boolean {
  if (a === b) return true
  if (a.length < 4 || b.length < 4 || Math.abs(a.length - b.length) > 2) return false
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const curr = [i]
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(curr[j-1] + 1, prev[j] + 1, prev[j-1] + Number(a[i-1] !== b[j-1]))
    }
    prev = curr
  }
  return prev[b.length] <= (a.length >= 7 ? 2 : 1)
}

function brandFor(value: string): string | null {
  const game = detectGameBrand({ name: value })
  if (game === 'gaming') return null
  if (game) return game
  const brand = detectProductBrandName(value)
  return brand === 'generic' ? null : brand
}

export function scoreProduct(product: SearchableProduct, rawQuery: string): number {
  const q = normalizeSearch(rawQuery.slice(0, 100))
  if (!q) return 0
  const name = normalizeSearch(product.name)
  const keywords = normalizeSearch(product.searchKeywords || '')
  const desc = normalizeSearch(product.shortDesc || '')
  const category = normalizeSearch(product.category || '')
  const queryTokens = q.split(' ').filter(Boolean)
  const nameTokens = name.split(' ')
  const keywordTokens = keywords.split(' ')
  const descriptionTokens = desc.split(' ')
  const categoryTokens = category.split(' ')
  const brand = brandFor(rawQuery)
  const productBrand = brandFor(product.name) || brandFor(product.category)
  let score = 0

  if (name === q) score += 180
  if (name.startsWith(q)) score += 100
  else if (name.includes(q)) score += 75
  if (keywords.includes(q)) score += 65
  if (desc.includes(q)) score += 14
  if (category.includes(q)) score += 15
  if (brand && brand === productBrand) score += 80

  let matched = 0
  for (const word of queryTokens) {
    if (nameTokens.includes(word)) { score += 18; matched++; continue }
    if (keywordTokens.includes(word)) { score += 15; matched++; continue }
    if (categoryTokens.includes(word)) { score += 8; matched++; continue }
    if (nameTokens.some(token => token.startsWith(word) && word.length >= 2)) { score += 11; matched++; continue }
    if (descriptionTokens.includes(word)) { score += 4; matched++; continue }
    if (nameTokens.some(token => nearWord(word, token)) || keywordTokens.some(token => nearWord(word, token))) {
      score += 6
      matched++
    }
  }
  if (!score) return 0
  if (matched === queryTokens.length) score += 12
  if (product.featured) score += 1
  return score
}

export function rankProducts<T extends SearchableProduct>(products: T[], q: string, limit = 100): T[] {
  if (!q.trim() || q.length > 100) return []
  return products
    .map(product => ({ product, score: scoreProduct(product, q) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name))
    .slice(0, Math.max(1, Math.min(limit, 300)))
    .map(item => item.product)
}
