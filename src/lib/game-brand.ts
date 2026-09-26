/**
 * Recognize specific game brands from multilingual storefront titles.
 * Return 'gaming' for mixed game bundles instead of attributing one
 * publisher's logo to another publisher's product.
 *
 * Keep this module framework-free so the matcher can be unit-tested.
 */
export type GameBrand = 'counter-strike' | 'valorant' | 'dota2' | 'gaming'

type GameDetectionInput = {
  name?: string | null
  category?: string | null
  icon?: string | null
}

const GAME_PATTERNS = [
  {
    key: 'counter-strike',
    test: /(?:^|[^\p{L}\p{N}])(?:counter[\s:./-]*strike(?:[\s:./-]*(?:2|ii|global[\s-]*offensive|go))?|cs[\s:./-]*(?:2|go|1[.\s]*6)|csgo|cs|кс[\s:./-]*2|кс|кантер[\s-]*страйк|контр[\s-]*страйк)(?=$|[^\p{L}\p{N}])/iu,
  },
  {
    key: 'valorant',
    test: /(?:^|[^\p{L}\p{N}])(?:valorant|valo|валорант|валарант|вало)(?=$|[^\p{L}\p{N}])/iu,
  },
  {
    key: 'dota2',
    test: /(?:^|[^\p{L}\p{N}])(?:dota[\s:./-]*(?:2|ii)|dota|дота[\s:./-]*(?:2|ii)|дота)(?=$|[^\p{L}\p{N}])/iu,
  },
] as const

function matchGame(text?: string | null): GameBrand | null {
  if (!text) return null
  const normalized = text.normalize('NFKC').replace(/[‐‑–—_]/g, ' ').replace(/\s+/g, ' ').trim()
  const matches = GAME_PATTERNS.filter(({ test }) => test.test(normalized))
  if (matches.length > 1) return 'gaming'
  return matches[0]?.key || null
}

export function detectGameBrand({ name, category, icon }: GameDetectionInput): GameBrand | null {
  // Product names override generic categories (e.g. Gaming / Network).
  // Only use a category or legacy icon if the name has no game match.
  return matchGame(name) || matchGame(category) || matchGame(icon)
}
