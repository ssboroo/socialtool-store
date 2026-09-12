import { createHash } from 'node:crypto'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import type { SupplierCatalogItem } from '@prisma/client'
import { db } from '@/lib/db'

const PRICE_CONFIG_KEY = 'supplier:g2g:config'
export const SUPPLIER_FEED_CONFIG_KEY = 'supplier:feed:config'
const MAX_FEED_BYTES = 10 * 1024 * 1024
const MAX_FEED_ROWS = 5000
const DEFAULT_ALLOWED_HOSTS = ['eneba.com']

export type SupplierFeedConfig = {
  supplierName: string
  feedUrl: string
  defaultCurrency: string
  lastSyncedAt: string | null
}

type PriceConfig = {
  markupPercent: number
  currencyRates: Record<string, number>
}

type FeedRow = Record<string, string>

type CanonicalFeedItem = {
  externalId: string
  name: string
  serviceName: string
  brandName: string | null
  regionName: string | null
  sourceUrl: string | null
  sourcePrice: number | null
  sourceCurrency: string
  available: boolean
}

const ALIASES = {
  id: ['externalid', 'external_id', 'id', 'productid', 'product_id', 'product-id', 'sku', 'ean', 'gtin'],
  name: ['name', 'title', 'productname', 'product_name', 'product-title', 'product_title'],
  price: ['price', 'minprice', 'min_price', 'lowestprice', 'lowest_price', 'amount', 'priceamount', 'price_amount'],
  currency: ['currency', 'currencycode', 'currency_code', 'pricecurrency', 'price_currency'],
  url: ['url', 'link', 'producturl', 'product_url', 'affiliateurl', 'affiliate_url', 'deeplink', 'deep_link'],
  category: ['category', 'categoryname', 'category_name', 'producttype', 'product_type', 'type', 'genre'],
  brand: ['platform', 'publisher', 'brand', 'manufacturer', 'developer'],
  region: ['region', 'regionname', 'region_name', 'country', 'territory', 'market'],
  available: ['available', 'availability', 'instock', 'in_stock', 'stock', 'quantity', 'qty'],
} as const

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/[\s.-]+/g, '_')
}

function pick(row: FeedRow, aliases: readonly string[]) {
  const normalized = new Map(Object.entries(row).map(([key, value]) => [normalizeKey(key), value]))
  for (const alias of aliases) {
    const value = normalized.get(normalizeKey(alias))
    if (value != null && String(value).trim()) return String(value).trim()
  }
  return ''
}

function parsePrice(value: string) {
  const raw = value.trim().replace(/\s/g, '').replace(/[^0-9,.-]/g, '')
  if (!raw) return null
  let normalized = raw
  const comma = raw.lastIndexOf(',')
  const dot = raw.lastIndexOf('.')
  if (comma >= 0 && dot >= 0) {
    normalized = comma > dot ? raw.replace(/\./g, '').replace(',', '.') : raw.replace(/,/g, '')
  } else if (comma >= 0) {
    const decimalDigits = raw.length - comma - 1
    normalized = decimalDigits === 2 ? raw.replace(',', '.') : raw.replace(/,/g, '')
  }
  const number = Number(normalized)
  return Number.isFinite(number) && number > 0 ? number : null
}

function parseAvailable(value: string) {
  const raw = value.trim().toLowerCase()
  if (!raw) return true
  const numeric = Number(raw)
  if (Number.isFinite(numeric)) return numeric > 0
  if (['false', 'no', 'off', 'out_of_stock', 'out of stock', 'unavailable', 'sold_out', 'sold out', '0'].includes(raw)) return false
  return true
}

function safeSourceUrl(value: string) {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

function stableId(parts: string[]) {
  return `feed-${createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 24)}`
}

function canonicalize(row: FeedRow, supplierName: string, defaultCurrency: string): CanonicalFeedItem | null {
  const name = pick(row, ALIASES.name).slice(0, 300)
  if (!name) return null
  const sourceUrl = safeSourceUrl(pick(row, ALIASES.url))
  const regionName = pick(row, ALIASES.region).slice(0, 80) || null
  const brandName = pick(row, ALIASES.brand).slice(0, 180) || null
  const serviceName = pick(row, ALIASES.category).slice(0, 180) || `${supplierName} Feed`
  const sourcePrice = parsePrice(pick(row, ALIASES.price))
  const sourceCurrency = (pick(row, ALIASES.currency) || defaultCurrency || 'EUR').toUpperCase().slice(0, 8)
  const explicitId = pick(row, ALIASES.id).slice(0, 180)
  const externalId = explicitId || stableId([name, sourceUrl || '', regionName || '', brandName || ''])
  return {
    externalId,
    name,
    serviceName,
    brandName,
    regionName,
    sourceUrl,
    sourcePrice,
    sourceCurrency,
    available: parseAvailable(pick(row, ALIASES.available)),
  }
}

function countDelimiter(line: string, delimiter: string) {
  let quoted = false
  let count = 0
  for (let i = 0; i < line.length; i += 1) {
    if (line[i] === '"') quoted = !quoted
    else if (!quoted && line[i] === delimiter) count += 1
  }
  return count
}

function parseCsv(text: string): FeedRow[] {
  const firstLine = text.split(/\r?\n/).find(line => line.trim()) || ''
  const delimiter = [',', ';', '\t'].sort((a, b) => countDelimiter(firstLine, b) - countDelimiter(firstLine, a))[0]
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    if (ch === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i += 1 }
      else quoted = !quoted
    } else if (ch === delimiter && !quoted) {
      row.push(cell); cell = ''
    } else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && text[i + 1] === '\n') i += 1
      row.push(cell); cell = ''
      if (row.some(value => value.trim())) rows.push(row)
      row = []
    } else cell += ch
  }
  row.push(cell)
  if (row.some(value => value.trim())) rows.push(row)
  if (rows.length < 2) return []
  const headers = rows[0].map(value => value.replace(/^\uFEFF/, '').trim())
  return rows.slice(1).map(values => Object.fromEntries(headers.map((header, index) => [header, (values[index] || '').trim()])))
}

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function xmlField(block: string, names: readonly string[]) {
  for (const name of names) {
    const escaped = escapeRegex(name)
    const pattern = new RegExp(`<(?:(?:[\\w.-]+):)?${escaped}\\b[^>]*>([\\s\\S]*?)<\\/(?:(?:[\\w.-]+):)?${escaped}\\s*>`, 'i')
    const match = block.match(pattern)
    if (match?.[1]) return decodeXml(match[1])
  }
  return ''
}

function xmlAttributes(value: string) {
  const row: FeedRow = {}
  const regex = /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(value))) row[match[1]] = decodeXml(match[2] ?? match[3] ?? '')
  return row
}

function parseXml(text: string): FeedRow[] {
  const tags = ['product', 'item', 'offer', 'entry']
  const allAliases = Array.from(new Set(Object.values(ALIASES).flat()))
  for (const tag of tags) {
    const regex = new RegExp(`<(?:(?:[\\w.-]+):)?${tag}\\b([^>]*)>([\\s\\S]*?)<\\/(?:(?:[\\w.-]+):)?${tag}\\s*>`, 'gi')
    const rows: FeedRow[] = []
    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) && rows.length < MAX_FEED_ROWS) {
      const block = match[2]
      const row = xmlAttributes(match[1] || '')
      for (const alias of allAliases) {
        const value = xmlField(block, [alias])
        if (value) row[alias] = value
      }
      if (Object.keys(row).length) rows.push(row)
    }
    if (rows.length) return rows
  }
  return []
}

function parseFeed(text: string, contentType: string) {
  const trimmed = text.trimStart()
  if (contentType.includes('xml') || trimmed.startsWith('<?xml') || trimmed.startsWith('<')) return { format: 'xml' as const, rows: parseXml(text) }
  return { format: 'csv' as const, rows: parseCsv(text) }
}

function cleanSupplierName(value: string) {
  return value.trim().replace(/[\r\n\t]/g, ' ').slice(0, 60) || 'ENEBA'
}

function cleanCurrency(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'EUR'
}

function allowedHostList() {
  const extras = (process.env.SUPPLIER_FEED_ALLOWED_HOSTS || '')
    .split(',')
    .map(value => value.trim().toLowerCase().replace(/^\*\./, ''))
    .filter(Boolean)
  return Array.from(new Set([...DEFAULT_ALLOWED_HOSTS, ...extras]))
}

function hostAllowed(hostname: string) {
  const host = hostname.toLowerCase().replace(/\.$/, '')
  return allowedHostList().some(allowed => host === allowed || host.endsWith(`.${allowed}`))
}

function privateIp(address: string) {
  if (address === '::1' || address === '0:0:0:0:0:0:0:1') return true
  if (address.startsWith('fc') || address.startsWith('fd') || address.startsWith('fe80:')) return true
  if (!address.includes('.')) return false
  const parts = address.split('.').map(Number)
  if (parts.length !== 4 || parts.some(part => !Number.isInteger(part))) return true
  return parts[0] === 10 || parts[0] === 127 || (parts[0] === 169 && parts[1] === 254) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168) || parts[0] === 0
}

async function validateFeedUrl(value: string) {
  let url: URL
  try { url = new URL(value) } catch { throw new Error('Feed URL буруу байна') }
  if (url.protocol !== 'https:') throw new Error('Feed URL заавал HTTPS байна')
  if (url.username || url.password) throw new Error('Feed URL дотор username/password оруулахгүй')
  if (url.port && url.port !== '443') throw new Error('Feed URL зөвхөн HTTPS 443 порт ашиглана')
  if (!hostAllowed(url.hostname)) {
    throw new Error(`${url.hostname} зөвшөөрөгдсөн feed host биш. Railway → SUPPLIER_FEED_ALLOWED_HOSTS-д энэ host-ыг нэмнэ үү.`)
  }
  if (isIP(url.hostname) && privateIp(url.hostname)) throw new Error('Private/local feed URL зөвшөөрөхгүй')
  const addresses = await lookup(url.hostname, { all: true })
  if (!addresses.length || addresses.some(item => privateIp(item.address))) throw new Error('Feed host private/local IP руу зааж байна')
  return url
}

async function readResponseText(response: Response) {
  const declared = Number(response.headers.get('content-length') || 0)
  if (declared > MAX_FEED_BYTES) throw new Error('Feed файл 10MB-аас их байна')
  if (!response.body) return ''
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_FEED_BYTES) {
      await reader.cancel()
      throw new Error('Feed файл 10MB-аас их байна')
    }
    chunks.push(value)
  }
  const merged = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength }
  return new TextDecoder('utf-8').decode(merged)
}

async function fetchFeed(feedUrl: string) {
  let current = await validateFeedUrl(feedUrl)
  for (let redirect = 0; redirect <= 3; redirect += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 25_000)
    try {
      const response = await fetch(current, {
        method: 'GET',
        cache: 'no-store',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          accept: 'text/csv,application/xml,text/xml,application/rss+xml,application/atom+xml,text/plain;q=0.8,*/*;q=0.1',
          'user-agent': 'SocialtoolStore-SupplierFeed/1.0',
        },
      })
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location')
        if (!location || redirect === 3) throw new Error('Feed redirect хэт олон эсвэл location дутуу байна')
        current = await validateFeedUrl(new URL(location, current).toString())
        continue
      }
      if (!response.ok) throw new Error(`Feed татахад HTTP ${response.status}`)
      const text = await readResponseText(response)
      return { text, contentType: response.headers.get('content-type') || '', finalUrl: current.toString() }
    } finally {
      clearTimeout(timeout)
    }
  }
  throw new Error('Feed татаж чадсангүй')
}

async function readPriceConfig(): Promise<PriceConfig> {
  let markupPercent = 15
  const currencyRates: Record<string, number> = { MNT: 1 }
  const setting = await db.siteSetting.findUnique({ where: { key: PRICE_CONFIG_KEY } })
  if (setting) {
    try {
      const parsed = JSON.parse(setting.value) as { markupPercent?: unknown; currencyRates?: Record<string, unknown> }
      const markup = Number(parsed.markupPercent)
      if (Number.isFinite(markup) && markup >= 0 && markup <= 300) markupPercent = markup
      for (const [currency, raw] of Object.entries(parsed.currencyRates || {})) {
        const rate = Number(raw)
        if (Number.isFinite(rate) && rate > 0) currencyRates[currency.toUpperCase()] = rate
      }
    } catch {}
  }
  return { markupPercent, currencyRates }
}

function roundSalePrice(value: number) {
  if (!Number.isFinite(value) || value <= 0) return null
  return Math.max(100, Math.ceil(value / 100) * 100)
}

export async function readSupplierFeedConfig(): Promise<SupplierFeedConfig | null> {
  const setting = await db.siteSetting.findUnique({ where: { key: SUPPLIER_FEED_CONFIG_KEY } })
  if (!setting) return null
  try {
    const parsed = JSON.parse(setting.value) as Partial<SupplierFeedConfig>
    if (!parsed.feedUrl) return null
    return {
      supplierName: cleanSupplierName(parsed.supplierName || 'ENEBA'),
      feedUrl: String(parsed.feedUrl),
      defaultCurrency: cleanCurrency(parsed.defaultCurrency || 'EUR'),
      lastSyncedAt: parsed.lastSyncedAt ? String(parsed.lastSyncedAt) : null,
    }
  } catch {
    return null
  }
}

async function saveSupplierFeedConfig(config: SupplierFeedConfig) {
  await db.siteSetting.upsert({
    where: { key: SUPPLIER_FEED_CONFIG_KEY },
    update: { value: JSON.stringify(config) },
    create: { key: SUPPLIER_FEED_CONFIG_KEY, value: JSON.stringify(config) },
  })
}

export async function syncSupplierFeed(input: {
  supplierName: string
  feedUrl: string
  defaultCurrency?: string
  limit?: number
  saveConfig?: boolean
}) {
  const supplierName = cleanSupplierName(input.supplierName)
  const defaultCurrency = cleanCurrency(input.defaultCurrency || 'EUR')
  const limit = Math.min(MAX_FEED_ROWS, Math.max(1, Math.floor(input.limit || MAX_FEED_ROWS)))
  const [{ text, contentType, finalUrl }, priceConfig] = await Promise.all([
    fetchFeed(input.feedUrl),
    readPriceConfig(),
  ])
  const parsed = parseFeed(text, contentType)
  if (!parsed.rows.length) throw new Error('Feed дотроос product мөр таньсангүй. CSV/XML баганын нэр эсвэл XML бүтэц тохирохгүй байна.')

  const canonical = parsed.rows
    .slice(0, limit)
    .map(row => canonicalize(row, supplierName, defaultCurrency))
    .filter((item): item is CanonicalFeedItem => Boolean(item))
  if (!canonical.length) throw new Error('Feed дотор нэртэй бүтээгдэхүүн олдсонгүй')

  const now = new Date()
  const missingCurrencies = new Set<string>()
  let priced = 0
  const operations = canonical.map(item => {
    const rate = priceConfig.currencyRates[item.sourceCurrency]
    if (item.sourcePrice && !rate) missingCurrencies.add(item.sourceCurrency)
    const salePrice = item.sourcePrice && rate
      ? roundSalePrice(item.sourcePrice * rate * (1 + priceConfig.markupPercent / 100))
      : null
    if (salePrice) priced += 1
    return db.supplierCatalogItem.upsert({
      where: { supplier_externalId: { supplier: supplierName, externalId: item.externalId } },
      update: {
        serviceName: item.serviceName,
        brandName: item.brandName,
        regionName: item.regionName,
        name: item.name,
        sourceUrl: item.sourceUrl,
        sourceCurrency: item.sourceCurrency,
        sourcePrice: item.sourcePrice,
        markupPercent: priceConfig.markupPercent,
        salePrice,
        available: item.available,
        metadata: JSON.stringify({ provider: 'FEED', format: parsed.format, feedHost: new URL(finalUrl).hostname }),
        lastSyncedAt: now,
      },
      create: {
        supplier: supplierName,
        externalId: item.externalId,
        serviceName: item.serviceName,
        brandName: item.brandName,
        regionName: item.regionName,
        name: item.name,
        sourceUrl: item.sourceUrl,
        sourceCurrency: item.sourceCurrency,
        sourcePrice: item.sourcePrice,
        markupPercent: priceConfig.markupPercent,
        salePrice,
        available: item.available,
        metadata: JSON.stringify({ provider: 'FEED', format: parsed.format, feedHost: new URL(finalUrl).hostname }),
        lastSyncedAt: now,
      },
    })
  })

  const syncedItems: SupplierCatalogItem[] = []
  for (let start = 0; start < operations.length; start += 100) {
    syncedItems.push(...await db.$transaction(operations.slice(start, start + 100)))
  }

  const productUpdates = syncedItems
    .filter(item => item.published && item.productId)
    .map(item => db.product.update({
      where: { id: item.productId! },
      data: item.salePrice
        ? { price: item.salePrice, available: item.available }
        : { available: false },
    }))
  for (let start = 0; start < productUpdates.length; start += 100) {
    await db.$transaction(productUpdates.slice(start, start + 100))
  }

  if (input.saveConfig !== false) {
    await saveSupplierFeedConfig({ supplierName, feedUrl: input.feedUrl, defaultCurrency, lastSyncedAt: now.toISOString() })
  }

  return {
    ok: true,
    supplierName,
    format: parsed.format,
    feedHost: new URL(finalUrl).hostname,
    parsedRows: parsed.rows.length,
    synced: syncedItems.length,
    priced,
    missingCurrencies: Array.from(missingCurrencies).sort(),
    markupPercent: priceConfig.markupPercent,
    lastSyncedAt: now.toISOString(),
  }
}
