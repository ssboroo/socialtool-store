export type SearchableProduct = {
  id: string
  name: string
  shortDesc?: string | null
  description?: string | null
  category?: string | null
  features?: string | null
  price?: number
  available?: boolean
  featured?: boolean
}

const SYNONYMS: Record<string, string[]> = {
  chatgpt: ['gpt','openai','чатгпт','чат жпт'],
  gemini: ['google ai','google one ai','google flow','жемини','джемини','veo'],
  facebook: ['fb','фейсбүүк','фэйсбүүк','meta'],
  instagram: ['ig','инста','инстаграм'],
  tiktok: ['tik tok','тик ток','тикток'],
  youtube: ['yt','ютуб','юүтүб'],
  telegram: ['tg','телеграм'],
  counterstrike: ['cs2','csgo','cs go','counter strike','counter-strike','кс2'],
  valorant: ['valo','валорант','валарант'],
  dota: ['dota2','dota 2','дота2','дота 2'],
  office: ['microsoft 365','ms office','word','excel','powerpoint','оффис'],
  windows: ['win11','win 11','виндовс','виндоус'],
  canva: ['канва'],
  capcut: ['cap cut','капкат'],
  vpn: ['proxy','прокси'],
}

export function normalizeSearchText(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase('en-US')
    .replace(/[‐‑‒–—―_]/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ').trim()
}

function editDistance(a: string, b: string) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  const prev = Array.from({length:b.length+1},(_,i)=>i)
  for (let i=1;i<=a.length;i++) {
    let diag=prev[0]; prev[0]=i
    for (let j=1;j<=b.length;j++) {
      const old=prev[j]
      prev[j]=Math.min(prev[j]+1,prev[j-1]+1,diag+(a[i-1]===b[j-1]?0:1))
      diag=old
    }
  }
  return prev[b.length]
}

function queryTerms(query: string) {
  const normalized = normalizeSearchText(query)
  const terms = new Set(normalized.split(' ').filter(Boolean))
  for (const [canonical, aliases] of Object.entries(SYNONYMS)) {
    const all=[canonical,...aliases].map(normalizeSearchText)
    if (all.some(alias=>normalized.includes(alias))) all.forEach(alias=>alias.split(' ').forEach(t=>t&&terms.add(t)))
  }
  return [...terms]
}

export function scoreSearchProduct(product: SearchableProduct, query: string) {
  const q=normalizeSearchText(query)
  if (!q) return 0
  const terms=queryTerms(query)
  const name=normalizeSearchText(product.name)
  const category=normalizeSearchText(product.category||'')
  const short=normalizeSearchText(product.shortDesc||'')
  const features=normalizeSearchText(product.features||'')
  const description=normalizeSearchText(product.description||'')
  let score=0
  if (name===q) score+=120
  if (name.startsWith(q)) score+=70
  if (name.includes(q)) score+=55
  if (category.includes(q)) score+=24
  for (const term of terms) {
    if (name.split(' ').includes(term)) score+=24
    else if (name.includes(term)) score+=15
    if (category.includes(term)) score+=8
    if (short.includes(term)) score+=6
    if (features.includes(term)) score+=4
    if (description.includes(term)) score+=1
    if (term.length>=4) {
      const words=name.split(' ')
      const best=Math.min(...words.map(word=>editDistance(word,term)))
      if (best===1) score+=10
      else if (best===2 && term.length>=6) score+=4
    }
  }
  if (product.featured) score+=2
  if (product.available===false) score-=30
  return score
}

export function smartSearch<T extends SearchableProduct>(products: T[], query: string, limit=8) {
  return products.map(product=>({product,score:scoreSearchProduct(product,query)}))
    .filter(item=>item.score>0)
    .sort((a,b)=>b.score-a.score || Number(b.product.featured)-Number(a.product.featured) || a.product.name.localeCompare(b.product.name))
    .slice(0,Math.max(1,Math.min(20,limit)))
    .map(item=>item.product)
}
