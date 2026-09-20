'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ClipboardPaste, Eye, FileUp, Loader2, PackagePlus, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { translateG2GProductNameMn, translateG2GRegionMn, translateG2GTextMn } from '@/lib/g2g-mn'

type BulkRow = {
  serviceName: string
  name: string
  sourceUrl: string
  sourcePrice?: string
  sourceCurrency?: string
  salePrice?: string
  brandName?: string
  regionName?: string
}

type CsvRow = Record<string, string>

type ImportResult = {
  itemId?: string
  name?: string
  salePrice?: number | null
  sourcePrice?: number | null
  sourceCurrency?: string
  status: 'created' | 'updated' | 'error'
  error?: string
}

function cleanUrl(value: string) {
  return value.trim().replace(/\\/g, '').replace(/[),.;]+$/, '')
}

function validG2GUrl(value: string) {
  try {
    const url = new URL(cleanUrl(value))
    const host = url.hostname.toLowerCase()
    return url.protocol === 'https:' && (host === 'g2g.com' || host.endsWith('.g2g.com'))
  } catch {
    return false
  }
}

function extractG2GUrl(value: string) {
  const match = value.match(/https:\/\/(?:[\w-]+\.)?g2g\.com\/[^\s<>"']+/i)
  return match ? cleanUrl(match[0]) : ''
}

function extractPrice(value: string): { price: string; currency: string } | null {
  const normalized = value.replace(/,/g, '').trim()
  const patterns: Array<{ regex: RegExp; currency: string | ((match: RegExpMatchArray) => string); group: number }> = [
    { regex: /\b(?:USD|US\$)\s*\$?\s*([0-9]+(?:\.[0-9]{1,2})?)/i, currency: 'USD', group: 1 },
    { regex: /\$\s*([0-9]+(?:\.[0-9]{1,2})?)/, currency: 'USD', group: 1 },
    { regex: /\bEUR\s*€?\s*([0-9]+(?:\.[0-9]{1,2})?)/i, currency: 'EUR', group: 1 },
    { regex: /€\s*([0-9]+(?:\.[0-9]{1,2})?)/, currency: 'EUR', group: 1 },
    { regex: /\b(MYR|SGD|GBP|AUD|CAD|JPY|KRW|IDR|PHP|THB|VND)\s*([0-9]+(?:\.[0-9]{1,2})?)/i, currency: match => match[1].toUpperCase(), group: 2 },
    { regex: /([0-9]+(?:\.[0-9]{1,2})?)\s*(USD|EUR|MYR|SGD|GBP|AUD|CAD|JPY|KRW|IDR|PHP|THB|VND)\b/i, currency: match => match[2].toUpperCase(), group: 1 },
  ]

  for (const pattern of patterns) {
    const match = normalized.match(pattern.regex)
    if (!match) continue
    const price = Number(match[pattern.group])
    if (!Number.isFinite(price) || price <= 0) continue
    return {
      price: String(price),
      currency: typeof pattern.currency === 'function' ? pattern.currency(match) : pattern.currency,
    }
  }

  return null
}

function isNoiseLine(value: string) {
  const line = value.trim()
  if (!line) return true
  if (extractG2GUrl(line)) return true
  if (/^(from|starting at|lowest price|price|buy now|buy|sell|seller|delivery|stock|available|rating|reviews?|view more|details?|add to cart|instant)$/i.test(line.replace(/[:：]/g, ''))) return true
  if (/^[★☆\d.,%+\-\s]+$/.test(line)) return true
  return false
}

function guessCategory(name: string, fallback: string) {
  const text = name.toLowerCase()
  if (/(instagram|facebook|tiktok|twitter|\bx\b|telegram|discord)/.test(text)) return 'Сошиал медиа'
  if (/(chatgpt|openai|claude|gemini|grok|perplexity|midjourney|higgsfield|meshy|cursor|lovable|loveable|notebooklm)/.test(text)) return 'AI хэрэгсэл'
  if (/(adobe|photoshop|illustrator|premiere|after effects|canva|capcut|coreldraw|motion array)/.test(text)) return 'Видео & Дизайн'
  if (/(visual studio|windows|office|project|autodesk|autocad|revit|microsoft)/.test(text)) return 'Программ & Лиценз'
  if (/(spotify|ableton|fl studio|voicemod|music|audio)/.test(text)) return 'Хөгжим & Аудио'
  if (/(netflix|rakuten|viki|streaming)/.test(text)) return 'Стрийминг'
  if (/(vpn|exitlag|proxy)/.test(text)) return 'VPN & Аюулгүй байдал'
  if (/(steam|playstation|xbox|nintendo|game|gaming)/.test(text)) return 'Gaming & Network'
  return fallback
}

function regionFromName(name: string, fallback: string) {
  const match = name.match(/\((global|worldwide|us|usa|uk|eu|europe|jp|japan|kr|korea|sg|singapore|my|malaysia|id|indonesia|ph|philippines|th|thailand|vn|vietnam|tr|turkey|in|india|ru|russia|br|brazil|latam)\)/i)
  return match?.[1] || fallback
}

function parseMarkdownTable(text: string, fallbackUrl: string, fallbackService: string, fallbackRegion: string, autoCategory: boolean) {
  const rows: BulkRow[] = []
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || !line.includes('|')) continue
    const cells = line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(v => v.trim())
    if (cells.length < 2) continue
    if (cells[0].replace(/[-:]/g, '').trim() === '') continue

    const [serviceCell, nameCell, urlCell = '', sourcePrice = '', sourceCurrency = 'USD', salePrice = ''] = cells
    if (/^(service|category|төрөл|ангилал)$/i.test(serviceCell) || /^(name|product|бараа)$/i.test(nameCell)) continue

    const sourceUrl = extractG2GUrl(urlCell) || (validG2GUrl(fallbackUrl) ? cleanUrl(fallbackUrl) : '')
    const name = nameCell || serviceCell
    if (!name || !sourceUrl) continue
    const serviceName = autoCategory ? guessCategory(name, fallbackService) : (serviceCell || fallbackService)
    rows.push({
      serviceName,
      brandName: serviceCell && serviceCell !== name ? serviceCell : '',
      regionName: regionFromName(name, fallbackRegion),
      name,
      sourceUrl,
      sourcePrice,
      sourceCurrency,
      salePrice,
    })
  }
  return rows
}

function parseCsv(text: string, fallbackUrl: string, fallbackService: string, fallbackRegion: string, autoCategory: boolean) {
  const rawRows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    if (ch === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"'
        i += 1
      } else quoted = !quoted
    } else if (ch === ',' && !quoted) {
      row.push(cell)
      cell = ''
    } else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && text[i + 1] === '\n') i += 1
      row.push(cell)
      cell = ''
      if (row.some(value => value.trim())) rawRows.push(row)
      row = []
    } else cell += ch
  }

  row.push(cell)
  if (row.some(value => value.trim())) rawRows.push(row)
  if (rawRows.length < 2) return [] as BulkRow[]

  const headers = rawRows[0].map(value => value.replace(/^\uFEFF/, '').trim())
  if (!headers.some(header => /^(name|product_name|sourceUrl|url|sourcePrice|price)$/i.test(header))) return []

  const csvRows: CsvRow[] = rawRows.slice(1).map(values =>
    Object.fromEntries(headers.map((header, index) => [header, (values[index] || '').trim()]))
  )

  return csvRows.flatMap((csvRow): BulkRow[] => {
    const name = csvRow.name || csvRow.product_name || ''
    if (!name) return []
    const sourceUrl = extractG2GUrl(csvRow.sourceUrl || csvRow.url || '') || (validG2GUrl(fallbackUrl) ? cleanUrl(fallbackUrl) : '')
    if (!sourceUrl) return []
    const rawService = csvRow.serviceName || csvRow.service_name || csvRow.brandName || csvRow.brand_name || fallbackService
    return [{
      serviceName: autoCategory ? guessCategory(name, rawService || fallbackService) : rawService,
      brandName: csvRow.brandName || csvRow.brand_name || '',
      regionName: csvRow.regionName || csvRow.region_name || regionFromName(name, fallbackRegion),
      name,
      sourceUrl,
      sourcePrice: csvRow.sourcePrice || csvRow.price || '',
      sourceCurrency: csvRow.sourceCurrency || csvRow.currency || 'USD',
      salePrice: csvRow.salePrice || '',
    }]
  })
}

function parsePlainText(text: string, fallbackUrl: string, fallbackService: string, fallbackRegion: string, autoCategory: boolean) {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  const rows: BulkRow[] = []
  const used = new Set<string>()

  for (let index = 0; index < lines.length; index += 1) {
    const price = extractPrice(lines[index])
    if (!price) continue

    let name = ''
    for (let back = index - 1; back >= Math.max(0, index - 7); back -= 1) {
      const candidate = lines[back]
      if (extractPrice(candidate) || isNoiseLine(candidate)) continue
      if (candidate.length < 3 || candidate.length > 240) continue
      name = candidate
      break
    }
    if (!name) continue

    let sourceUrl = ''
    for (let scan = Math.max(0, index - 7); scan <= Math.min(lines.length - 1, index + 4); scan += 1) {
      const found = extractG2GUrl(lines[scan])
      if (found) {
        sourceUrl = found
        break
      }
    }
    sourceUrl ||= validG2GUrl(fallbackUrl) ? cleanUrl(fallbackUrl) : ''
    if (!sourceUrl) continue

    const key = `${name.toLowerCase()}|${sourceUrl}|${price.currency}|${price.price}`
    if (used.has(key)) continue
    used.add(key)

    rows.push({
      serviceName: autoCategory ? guessCategory(name, fallbackService) : fallbackService,
      name,
      sourceUrl,
      sourcePrice: price.price,
      sourceCurrency: price.currency,
      brandName: '',
      regionName: regionFromName(name, fallbackRegion),
    })
  }

  if (rows.length) return rows

  for (let index = 0; index < lines.length; index += 1) {
    const sourceUrl = extractG2GUrl(lines[index])
    if (!sourceUrl) continue
    let name = ''
    for (let back = index - 1; back >= Math.max(0, index - 5); back -= 1) {
      if (!isNoiseLine(lines[back]) && lines[back].length >= 3 && lines[back].length <= 240) {
        name = lines[back]
        break
      }
    }
    if (!name) continue
    const nearby = lines.slice(Math.max(0, index - 4), Math.min(lines.length, index + 5)).map(extractPrice).find(Boolean)
    const key = `${name.toLowerCase()}|${sourceUrl}`
    if (used.has(key)) continue
    used.add(key)
    rows.push({
      serviceName: autoCategory ? guessCategory(name, fallbackService) : fallbackService,
      name,
      sourceUrl,
      sourcePrice: nearby?.price || '',
      sourceCurrency: nearby?.currency || 'USD',
      regionName: regionFromName(name, fallbackRegion),
    })
  }

  return rows
}

function parseInput(text: string, fallbackUrl: string, fallbackService: string, fallbackRegion: string, autoCategory: boolean) {
  const csv = parseCsv(text, fallbackUrl, fallbackService, fallbackRegion, autoCategory)
  if (csv.length) return csv
  const markdown = parseMarkdownTable(text, fallbackUrl, fallbackService, fallbackRegion, autoCategory)
  if (markdown.length) return markdown
  return parsePlainText(text, fallbackUrl, fallbackService, fallbackRegion, autoCategory)
}

function money(value: number | null) {
  return value == null ? '—' : `${Math.round(value).toLocaleString('en-US')} ₮`
}

export function G2GBulkDraftImport() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [rawText, setRawText] = useState('')
  const [rows, setRows] = useState<BulkRow[]>([])
  const [sourcePageUrl, setSourcePageUrl] = useState('')
  const [defaultService, setDefaultService] = useState('Дижитал хэрэгсэл')
  const [defaultRegion, setDefaultRegion] = useState('Global')
  const [markup, setMarkup] = useState('100')
  const [autoCategory, setAutoCategory] = useState(true)
  const [rates, setRates] = useState<Record<string, number>>({ MNT: 1 })
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState('')
  const [importedIds, setImportedIds] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/admin/suppliers/g2g?limit=10', { cache: 'no-store' })
      .then(async response => {
        const body = await response.json()
        if (!response.ok) return
        setRates(body.config?.currencyRates || { MNT: 1 })
      })
      .catch(() => {})
  }, [])

  const preview = useMemo(() => rows.slice(0, 12), [rows])

  const processText = (text = rawText) => {
    const parsed = parseInput(text, sourcePageUrl, defaultService, defaultRegion, autoCategory).slice(0, 500)
    if (!parsed.length) {
      const needsUrl = !extractG2GUrl(text) && !validG2GUrl(sourcePageUrl)
      toast.error(needsUrl
        ? 'Бараа таньсангүй. G2G бүтээгдэхүүний/ангиллын URL-ийг дээр нэг удаа оруулаад дахин оролдоно уу.'
        : 'Нэр + үнэ бүхий G2G бараа таньсангүй. Copy хийсэн хэсэгт бүтээгдэхүүний нэр, US$/USD үнэ хамт байх хэрэгтэй.')
      setRows([])
      return
    }
    setRows(parsed)
    setImportedIds([])
    setResult('')
    toast.success(`${parsed.length} G2G бараа танигдлаа`)
  }

  const readFile = async (file: File) => {
    const text = await file.text()
    setRawText(text)
    processText(text)
  }

  const pasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (!text.trim()) return toast.error('Clipboard хоосон байна')
      setRawText(text)
      processText(text)
    } catch {
      toast.info('Ctrl+V ашиглан доорх талбарт G2G жагсаалтаа paste хийнэ үү')
    }
  }

  const publishIds = async (ids: string[]) => {
    let created = 0
    let updated = 0
    let errors = 0
    for (let start = 0; start < ids.length; start += 250) {
      const response = await fetch('/api/admin/suppliers/g2g/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: ids.slice(start, start + 250) }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Дэлгүүрт нийтлэх алдаа')
      created += Number(body.created || 0)
      updated += Number(body.updated || 0)
      errors += Array.isArray(body.errors) ? body.errors.length : 0
    }
    return { created, updated, errors }
  }

  const importRows = async (publishAfter = false) => {
    if (!rows.length) return toast.error('Эхлээд G2G жагсаалтаа боловсруулна уу')
    const markupPercent = Number(markup)
    if (!Number.isFinite(markupPercent) || markupPercent < 0 || markupPercent > 300) {
      return toast.error('Markup 0–300% хооронд байна')
    }

    if (publishAfter && !window.confirm(`${rows.length} барааг импортлоод дэлгүүрт шууд нийтэлнэ. Markup: ${markupPercent}%. Үргэлжлүүлэх үү?`)) return

    setBusy(true)
    try {
      const res = await fetch('/api/admin/suppliers/g2g/manual/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, markupPercent }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Импорт алдаа')

      const summary = body.summary || {}
      const results = (Array.isArray(body.results) ? body.results : []) as ImportResult[]
      const ids = results.filter(item => item.itemId && item.salePrice && item.salePrice > 0).map(item => item.itemId as string)
      setImportedIds(ids)

      let message = `${summary.created || 0} шинэ · ${summary.updated || 0} шинэчилсэн · ${summary.translated || 0} Монголчилсон · ${summary.priced || 0} үнэтэй · ${summary.drafts || 0} үнэ дутуу · ${summary.errors || 0} алдаа`

      if (publishAfter && ids.length) {
        const published = await publishIds(ids)
        message += ` · Store: ${published.created} шинэ, ${published.updated} шинэчилсэн, ${published.errors} алдаа`
      }

      setResult(message)
      if (summary.errors) toast.error(message)
      else toast.success(publishAfter ? `Импорт + нийтлэлт дууслаа: ${message}` : `G2G импорт дууслаа: ${message}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'G2G импорт алдаа')
    } finally {
      setBusy(false)
    }
  }

  const publishImported = async () => {
    if (!importedIds.length) return toast.error('Нийтлэх үнэтэй импорт олдсонгүй')
    if (!window.confirm(`${importedIds.length} импортолсон барааг дэлгүүрт нийтлэх үү?`)) return
    setBusy(true)
    try {
      const published = await publishIds(importedIds)
      const message = `Store: ${published.created} шинэ · ${published.updated} шинэчилсэн · ${published.errors} алдаа`
      setResult(current => current ? `${current} · ${message}` : message)
      toast.success(message)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Нийтлэх алдаа')
    } finally {
      setBusy(false)
    }
  }

  const previewPrice = (row: BulkRow) => {
    const source = Number(row.sourcePrice)
    const rate = rates[(row.sourceCurrency || 'USD').toUpperCase()]
    const markupPercent = Number(markup)
    if (!Number.isFinite(source) || source <= 0 || !rate || !Number.isFinite(markupPercent)) return null
    return Math.max(100, Math.ceil((source * rate * (1 + markupPercent / 100)) / 100) * 100)
  }

  return (
    <div className="mb-5 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardPaste className="size-5 text-violet-600" />
            <h2 className="text-lg font-extrabold text-[#102A43]">G2G Copy → Paste Import</h2>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-[#5B7290]">
            G2G хуудсан дээрээс бүтээгдэхүүний нэр + үнийн жагсаалтыг copy хийгээд энд paste хийнэ. Нэр, бүс, ангиллыг Монголчилж, хадгалсан валютын ханшаар ₮ болгож, default <b>100% markup</b>-аар зарах үнийг бодно. G2G API key шаардлагагүй.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => void pasteClipboard()} disabled={busy}>
            <ClipboardPaste className="size-4" /> Clipboard-оос
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={() => fileRef.current?.click()} disabled={busy}>
            <FileUp className="size-4" /> CSV / TXT
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.md,.txt,text/csv,text/plain,text/markdown"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) void readFile(file)
              e.currentTarget.value = ''
            }}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_280px]">
        <div>
          <label className="text-xs font-semibold text-[#5B7290]">G2G-ээс copy хийсэн текст</label>
          <textarea
            value={rawText}
            onChange={e => { setRawText(e.target.value); setRows([]); setImportedIds([]) }}
            rows={10}
            className="mt-1 w-full rounded-xl border border-violet-200 bg-white p-3 font-mono text-xs text-[#102A43]"
            placeholder={'Жишээ:\nInstagram 10,000 Followers Account (Global)\nFrom US$ 27.50\nhttps://www.g2g.com/...\n\n2022 Instagram Old Account (Global)\nUSD 8.40'}
          />
        </div>

        <div className="space-y-3 rounded-xl border border-violet-100 bg-white/80 p-3">
          <label className="block text-xs font-semibold text-[#5B7290]">
            G2G page URL
            <input value={sourcePageUrl} onChange={e => { setSourcePageUrl(e.target.value); setRows([]) }} className="mt-1 h-9 w-full rounded-lg border border-[#D6E4FF] px-2 text-xs" placeholder="https://www.g2g.com/categories/..." />
            <span className="mt-1 block font-normal">Copy текстэд линк байхгүй бол одоо нээлттэй G2G page-ийн URL-ийг нэг удаа тавина.</span>
          </label>
          <label className="block text-xs font-semibold text-[#5B7290]">
            Default ангилал
            <input value={defaultService} onChange={e => { setDefaultService(e.target.value); setRows([]) }} className="mt-1 h-9 w-full rounded-lg border border-[#D6E4FF] px-2 text-xs" />
          </label>
          <label className="block text-xs font-semibold text-[#5B7290]">
            Default region
            <input value={defaultRegion} onChange={e => { setDefaultRegion(e.target.value); setRows([]) }} className="mt-1 h-9 w-full rounded-lg border border-[#D6E4FF] px-2 text-xs" placeholder="Global" />
          </label>
          <label className="block text-xs font-semibold text-[#5B7290]">
            Markup %
            <input type="number" min="0" max="300" step="1" value={markup} onChange={e => { setMarkup(e.target.value); setImportedIds([]) }} className="mt-1 h-9 w-full rounded-lg border border-[#D6E4FF] px-2 text-xs" />
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-[#102A43]">
            <input type="checkbox" checked={autoCategory} onChange={e => { setAutoCategory(e.target.checked); setRows([]) }} />
            Ангиллыг нэрээс автоматаар таних
          </label>
          <Button type="button" onClick={() => processText()} disabled={busy || !rawText.trim()} className="w-full rounded-xl bg-violet-600 text-white">
            <Eye className="size-4" /> 1. Боловсруулж харах
          </Button>
        </div>
      </div>

      {rows.length ? (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-violet-200 bg-white p-3 text-sm">
            <div><b>{rows.length} бараа</b> танигдсан · Markup <b>{markup}%</b></div>
            <div className="text-xs text-[#5B7290]">USD ханш: {rates.USD ? `${rates.USD.toLocaleString('en-US')}₮` : 'тохируулаагүй'}</div>
          </div>

          <div className="max-h-80 overflow-auto rounded-xl border border-violet-100 bg-white">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="sticky top-0 bg-[#F8F5FF] text-[#5B7290]">
                <tr><th className="p-2">Original</th><th className="p-2">Монгол нэр</th><th className="p-2">Ангилал / Бүс</th><th className="p-2">G2G үнэ</th><th className="p-2">Зарах үнэ</th></tr>
              </thead>
              <tbody>
                {preview.map((row, index) => {
                  const sale = previewPrice(row)
                  return <tr key={`${row.name}-${index}`} className="border-t border-violet-50">
                    <td className="max-w-[260px] p-2">{row.name}</td>
                    <td className="max-w-[280px] p-2 font-semibold text-[#102A43]">{translateG2GProductNameMn(row.name)}</td>
                    <td className="p-2">{translateG2GTextMn(row.serviceName)}<div className="text-[11px] text-[#5B7290]">{translateG2GRegionMn(row.regionName)}</div></td>
                    <td className="p-2 font-mono">{row.sourcePrice ? `${row.sourcePrice} ${row.sourceCurrency || 'USD'}` : 'Үнэ дутуу'}</td>
                    <td className="p-2 font-bold text-[#0B4DBA]">{sale ? money(sale) : 'Ханш/үнэ дутуу'}</td>
                  </tr>
                })}
              </tbody>
            </table>
            {rows.length > preview.length ? <div className="border-t border-violet-100 p-2 text-center text-xs text-[#5B7290]">… +{rows.length - preview.length} бараа</div> : null}
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
            Томьёо: <b>G2G өртөг × валютын ханш × (1 + markup/100)</b>. 100% markup үед $10 × 3,600 × 2 = 72,000₮. Үнэ 100₮-өөр дээш тоймлогдоно.
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <Button onClick={() => void importRows(false)} disabled={busy} variant="outline" className="rounded-xl border-violet-300">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <PackagePlus className="size-4" />} 2. Catalog-д импортлох
            </Button>
            <Button onClick={() => void importRows(true)} disabled={busy} className="rounded-xl bg-gradient-to-r from-violet-600 to-[#1677FF] text-white">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />} Импорт + шууд нийтлэх
            </Button>
            <Button onClick={() => void publishImported()} disabled={busy || !importedIds.length} className="rounded-xl bg-emerald-600 text-white disabled:opacity-50">
              <Rocket className="size-4" /> 3. Импортолсныг нийтлэх ({importedIds.length})
            </Button>
          </div>

          {result ? <div className="rounded-xl bg-[#F5F9FF] px-3 py-2 text-xs font-semibold text-[#0B4DBA]">{result}</div> : null}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-violet-200 bg-white/70 p-4 text-center text-xs text-[#5B7290]">
          G2G дээр барааны жагсаалт харагдаж байх үед <b>Ctrl+A → Ctrl+C</b> эсвэл хэрэгтэй хэсгээ copy → энд <b>Ctrl+V</b> → “Боловсруулж харах”. Scraping/browser bot ашиглахгүй.
        </div>
      )}
    </div>
  )
}
