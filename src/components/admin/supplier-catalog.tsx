'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Cloud, Database, Loader2, RefreshCw, Rocket, Search, Settings2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type Service = {
  service_id: string
  service_name: string
  categories?: Array<{ category_id?: string; category_name: string; sub_categories?: Array<{ category_id: string; category_name: string }> }>
}
type Brand = { brand_id: string; brand_name: string }
type CatalogItem = {
  id: string
  externalId: string
  serviceName: string
  brandName: string | null
  regionName: string | null
  name: string
  sourceCurrency: string | null
  sourcePrice: number | null
  markupPercent: number
  salePrice: number | null
  available: boolean
  published: boolean
  lastSyncedAt: string
}
type Dashboard = {
  configured: boolean
  requiredEnv: string[]
  config: { markupPercent: number; currencyRates: Record<string, number> }
  stats: { total: number; priced: number; published: number; available: number; lastSyncedAt: string | null }
  items: CatalogItem[]
  pagination: { page: number; limit: number; total: number; pages: number }
}
type CsvRow = Record<string, string>

function parseCsv(text: string) {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    if (ch === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i += 1 }
      else quoted = !quoted
    } else if (ch === ',' && !quoted) {
      row.push(cell); cell = ''
    } else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && text[i + 1] === '\n') i += 1
      row.push(cell); cell = ''
      if (row.some(v => v.trim())) rows.push(row)
      row = []
    } else cell += ch
  }
  row.push(cell)
  if (row.some(v => v.trim())) rows.push(row)
  if (rows.length < 2) return [] as CsvRow[]
  const headers = rows[0].map(v => v.replace(/^\uFEFF/, '').trim())
  return rows.slice(1).map(values => Object.fromEntries(headers.map((header, index) => [header, (values[index] || '').trim()])))
}

function money(value: number | null) {
  return value == null ? '—' : `${Math.round(value).toLocaleString('en-US')} ₮`
}

function ratesToText(rates: Record<string, number>) {
  return Object.entries(rates).filter(([code]) => code !== 'MNT').map(([code, rate]) => `${code}=${rate}`).join('\n')
}

function textToRates(text: string) {
  const rates: Record<string, number> = { MNT: 1 }
  for (const line of text.split(/\r?\n/)) {
    const [left, right] = line.split('=')
    const code = (left || '').trim().toUpperCase()
    const rate = Number((right || '').replace(/[,\s]/g, ''))
    if (code && Number.isFinite(rate) && rate > 0) rates[code] = rate
  }
  return rates
}

export function SupplierCatalog() {
  const [data, setData] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [query, setQuery] = useState('')
  const [markup, setMarkup] = useState('15')
  const [rates, setRates] = useState('')
  const [progress, setProgress] = useState('')
  const csvRef = useRef<HTMLInputElement>(null)

  const loadLocal = async (q = query) => {
    const res = await fetch(`/api/admin/suppliers/g2g?q=${encodeURIComponent(q)}&limit=100`, { cache: 'no-store' })
    const body = await res.json()
    if (!res.ok) throw new Error(body.error || 'Supplier каталог уншиж чадсангүй')
    setData(body)
    setMarkup(String(body.config.markupPercent))
    setRates(ratesToText(body.config.currencyRates))
    return body as Dashboard
  }

  useEffect(() => {
    let active = true
    fetch('/api/admin/suppliers/g2g?limit=100', { cache: 'no-store' })
      .then(async res => {
        const body = await res.json()
        if (!res.ok) throw new Error(body.error || 'Supplier каталог уншиж чадсангүй')
        if (!active) return
        setData(body)
        setMarkup(String(body.config.markupPercent))
        setRates(ratesToText(body.config.currencyRates))
      })
      .catch(error => { if (active) toast.error(error instanceof Error ? error.message : 'Supplier каталогийн алдаа') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const saveSettings = async () => {
    const markupPercent = Number(markup)
    setBusy(true)
    try {
      const res = await fetch('/api/admin/suppliers/g2g', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markupPercent, currencyRates: textToRates(rates) }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Тохиргоо хадгалж чадсангүй')
      toast.success('Supplier үнэ тооцооллын тохиргоо хадгалагдлаа')
      await loadLocal()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Тохиргооны алдаа')
    } finally { setBusy(false) }
  }

  const remoteJson = async (url: string) => {
    const res = await fetch(url, { cache: 'no-store' })
    const body = await res.json()
    if (!res.ok) throw new Error(body.error || 'G2G API алдаа')
    return body
  }

  const syncBrand = async (service: Service, brand: Brand) => {
    const res = await fetch('/api/admin/suppliers/g2g/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: service.service_id,
        serviceName: service.service_name,
        brandId: brand.brand_id,
        brandName: brand.brand_name,
      }),
    })
    const body = await res.json()
    if (!res.ok) throw new Error(`${brand.brand_name}: ${body.error || 'sync алдаа'}`)
    return Number(body.synced || 0)
  }

  const syncAll = async () => {
    if (!data?.configured) {
      toast.error('Railway Variables дээр G2G_API_KEY, G2G_SECRET_KEY, G2G_USER_ID тохируулсны дараа sync ажиллана')
      return
    }
    setBusy(true)
    setProgress('G2G үйлчилгээний жагсаалт авч байна…')
    try {
      const serviceBody = await remoteJson('/api/admin/suppliers/g2g?remote=services') as { services: Service[] }
      let totalBrands = 0
      let totalProducts = 0
      for (const service of serviceBody.services || []) {
        let after = ''
        let page = 0
        do {
          const brandBody = await remoteJson(`/api/admin/suppliers/g2g?remote=brands&serviceId=${encodeURIComponent(service.service_id)}${after ? `&after=${encodeURIComponent(after)}` : ''}`) as { brands: Brand[]; after: string }
          page += 1
          const brands = brandBody.brands || []
          for (let start = 0; start < brands.length; start += 3) {
            const chunk = brands.slice(start, start + 3)
            const counts = await Promise.all(chunk.map(brand => syncBrand(service, brand)))
            totalBrands += chunk.length
            totalProducts += counts.reduce((sum, count) => sum + count, 0)
            setProgress(`${service.service_name}: ${totalBrands} брэнд · ${totalProducts} бүтээгдэхүүн синк хийлээ`)
          }
          after = brandBody.after || ''
          if (page > 100) throw new Error('G2G brand pagination хамгаалалтын хязгаарт хүрлээ')
        } while (after)
      }
      toast.success(`${totalProducts} G2G catalog бүтээгдэхүүн синк хийгдлээ`)
      setProgress(`Дууслаа: ${totalBrands} брэнд · ${totalProducts} бүтээгдэхүүн`)
      await loadLocal()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'G2G sync алдаа'
      setProgress(message)
      toast.error(message)
    } finally { setBusy(false) }
  }

  const importCsv = async (file: File) => {
    if (!/\.csv$/i.test(file.name)) return toast.error('CSV UTF-8 файл сонгоно уу')
    const rows = parseCsv(await file.text()).slice(0, 1000).map(row => ({
      externalId: row.externalId || row.product_id || row.id,
      name: row.name || row.product_name,
      serviceName: row.serviceName || row.service_name,
      brandName: row.brandName || row.brand_name,
      regionName: row.regionName || row.region_name,
      sourcePrice: row.sourcePrice || row.price,
      sourceCurrency: row.sourceCurrency || row.currency || 'MNT',
      salePrice: row.salePrice,
      markupPercent: row.markupPercent,
      available: row.available,
    }))
    if (!rows.length) return toast.error('CSV дотор мөр олдсонгүй')
    setBusy(true)
    setProgress(`${rows.length} үнийн мөр импортлож байна…`)
    try {
      const res = await fetch('/api/admin/suppliers/g2g/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'CSV импорт алдаа')
      setProgress(`Үнэ импорт: ${body.summary.created} шинэ · ${body.summary.updated} шинэчилсэн · ${body.summary.errors} алдаа`)
      if (body.summary.errors) {
        const first = (body.results as Array<{ row: number; status: string; error?: string }>).filter(r => r.status === 'error').slice(0, 5)
        toast.error(first.map(r => `${r.row}-р мөр: ${r.error}`).join('\n'))
      } else toast.success('Supplier үнэ амжилттай импортлогдлоо')
      await loadLocal()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'CSV импорт алдаа')
    } finally { setBusy(false) }
  }

  const publishAll = async () => {
    setBusy(true)
    let total = 0
    setProgress('Үнэтэй каталогийг дэлгүүрт нийтэлж байна…')
    try {
      for (let pass = 0; pass < 100; pass += 1) {
        const res = await fetch('/api/admin/suppliers/g2g/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ allPriced: true, limit: 250 }),
        })
        const body = await res.json()
        if (!res.ok) throw new Error(body.error || 'Нийтлэх алдаа')
        total += Number(body.created || 0) + Number(body.updated || 0)
        setProgress(`${total} бүтээгдэхүүн дэлгүүрт нийтлэгдлээ${body.remaining ? ` · ${body.remaining} үлдсэн` : ''}`)
        if (!body.remaining || !body.processed) break
      }
      toast.success(`${total} бүтээгдэхүүн дэлгүүрт нийтлэгдлээ`)
      await loadLocal()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Нийтлэх алдаа')
    } finally { setBusy(false) }
  }

  const publishOne = async (id: string) => {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/suppliers/g2g/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [id] }) })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Нийтлэх алдаа')
      toast.success('Бүтээгдэхүүн дэлгүүрт нийтлэгдлээ')
      await loadLocal()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Нийтлэх алдаа') }
    finally { setBusy(false) }
  }

  const template = () => {
    const csv = [
      'externalId,name,serviceName,brandName,regionName,sourcePrice,sourceCurrency,salePrice,markupPercent,available',
      'example-001,Steam Wallet 10 USD,Gift Cards,Steam,US,10,USD,,15,true',
      'example-002,Mobile Top Up 100,Direct top up,Example,Global,,,25000,15,true',
    ].join('\r\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'supplier-prices-template.csv'; a.click(); URL.revokeObjectURL(url)
  }

  const stats = useMemo(() => data?.stats, [data])
  if (loading) return <div className="grid min-h-60 place-items-center"><Loader2 className="size-6 animate-spin text-[#1677FF]" /></div>
  if (!data) return <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">Supplier каталог ачаалсангүй.</div>

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2"><Database className="size-5 text-[#1677FF]" /><h2 className="text-xl font-extrabold text-[#102A43]">Supplier Catalog</h2></div>
          <p className="mt-1 text-sm text-[#5B7290]">G2G official catalog + supplier үнэ + автоматаар дэлгүүрт нийтлэх.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-full" onClick={() => void loadLocal()} disabled={busy}><RefreshCw className="size-4" /> Шинэчлэх</Button>
          <Button className="rounded-full bg-gradient-to-r from-[#1677FF] to-[#0B4DBA]" onClick={syncAll} disabled={busy || !data.configured}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Cloud className="size-4" />} G2G каталог sync</Button>
        </div>
      </div>

      <div className={`rounded-2xl border p-4 ${data.configured ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
        <div className="flex gap-3">
          {data.configured ? <CheckCircle2 className="mt-0.5 size-5 text-emerald-600" /> : <AlertTriangle className="mt-0.5 size-5 text-amber-600" />}
          <div className="text-sm">
            <b>{data.configured ? 'G2G API холбоход бэлэн' : 'G2G API key дутуу'}</b>
            <p className="mt-1 opacity-80">{data.configured ? 'Sync товч G2G-ийн албан ёсны services → brands → products каталогийг татна.' : `Railway Variables: ${data.requiredEnv.join(', ')}`}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ['Каталог', stats?.total || 0], ['Үнэтэй', stats?.priced || 0], ['Нийтэлсэн', stats?.published || 0], ['Идэвхтэй', stats?.available || 0], ['Markup', `${data.config.markupPercent}%`],
        ].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-[#D6E4FF] bg-white p-4"><div className="text-xs font-semibold text-[#5B7290]">{label}</div><div className="mt-1 text-2xl font-extrabold text-[#102A43]">{value}</div></div>)}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.35fr]">
        <div className="rounded-2xl border border-[#D6E4FF] bg-white p-5">
          <div className="flex items-center gap-2"><Settings2 className="size-4 text-[#1677FF]" /><b>Үнэ тооцоолол</b></div>
          <label className="mt-4 block text-xs font-semibold text-[#5B7290]">Default markup %</label>
          <input value={markup} onChange={e => setMarkup(e.target.value)} inputMode="decimal" className="mt-1 h-10 w-full rounded-xl border border-[#D6E4FF] px-3 text-sm" />
          <label className="mt-3 block text-xs font-semibold text-[#5B7290]">1 нэгж валют = хэдэн ₮</label>
          <textarea value={rates} onChange={e => setRates(e.target.value)} rows={5} placeholder={'USD=3600\nMYR=850\nSGD=2800'} className="mt-1 w-full rounded-xl border border-[#D6E4FF] p-3 font-mono text-sm" />
          <p className="mt-1 text-[11px] text-[#5B7290]">Ханшийг та өөрөө шинэчилнэ. MNT=1 автоматаар.</p>
          <Button onClick={saveSettings} disabled={busy} className="mt-3 w-full rounded-xl">Тохиргоо хадгалах</Button>
        </div>

        <div className="rounded-2xl border border-[#D6E4FF] bg-white p-5">
          <b>Supplier үнэ импорт</b>
          <p className="mt-1 text-xs text-[#5B7290]">G2G catalog нь taxonomy өгнө. Бодит reseller өртөг/үнэ нь таны зөвшөөрөгдсөн supplier feed эсвэл CSV-ээс орно.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <button type="button" onClick={template} className="rounded-xl border border-[#D6E4FF] bg-[#F8FAFF] p-4 text-left text-sm font-semibold hover:bg-[#EEF4FF]">CSV загвар татах</button>
            <button type="button" onClick={() => csvRef.current?.click()} className="rounded-xl border border-[#D6E4FF] bg-[#F8FAFF] p-4 text-left text-sm font-semibold hover:bg-[#EEF4FF]"><Upload className="mb-2 size-4 text-[#1677FF]" />Үнэ CSV импорт</button>
            <button type="button" onClick={publishAll} disabled={busy || !stats?.priced} className="rounded-xl border border-[#1677FF]/30 bg-[#E8F1FF] p-4 text-left text-sm font-semibold text-[#0B4DBA] disabled:opacity-50"><Rocket className="mb-2 size-4" />Үнэтэйг бүгдийг нийтлэх</button>
          </div>
          <input ref={csvRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) void importCsv(file); e.currentTarget.value = '' }} />
          {progress ? <div className="mt-4 rounded-xl bg-[#F5F9FF] px-3 py-2 text-xs font-semibold text-[#0B4DBA]">{progress}</div> : null}
        </div>
      </div>

      <div className="rounded-2xl border border-[#D6E4FF] bg-white p-4">
        <form onSubmit={e => { e.preventDefault(); void loadLocal(query) }} className="mb-4 flex gap-2">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5B7290]" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Нэр, брэнд, бүс, external ID хайх…" className="h-10 w-full rounded-xl border border-[#D6E4FF] pl-9 pr-3 text-sm" /></div>
          <Button variant="outline" className="rounded-xl">Хайх</Button>
        </form>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead><tr className="border-b border-[#D6E4FF] text-xs text-[#5B7290]"><th className="p-3">Бүтээгдэхүүн</th><th className="p-3">Төрөл</th><th className="p-3">Өртөг</th><th className="p-3">Зарах үнэ</th><th className="p-3">Төлөв</th><th className="p-3 text-right">Үйлдэл</th></tr></thead>
            <tbody>{data.items.map(item => <tr key={item.id} className="border-b border-[#EEF4FF] last:border-0">
              <td className="p-3"><div className="max-w-[360px] font-semibold text-[#102A43]">{item.name}</div><div className="mt-0.5 text-[11px] text-[#5B7290]">{[item.brandName, item.regionName, item.externalId].filter(Boolean).join(' · ')}</div></td>
              <td className="p-3 text-xs">{item.serviceName}</td>
              <td className="p-3 text-xs">{item.sourcePrice == null ? '—' : `${item.sourcePrice} ${item.sourceCurrency || ''}`}</td>
              <td className="p-3 font-bold text-[#102A43]">{money(item.salePrice)}</td>
              <td className="p-3"><span className={`rounded-full px-2 py-1 text-[11px] font-bold ${item.published ? 'bg-emerald-100 text-emerald-700' : item.salePrice ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{item.published ? 'Нийтэлсэн' : item.salePrice ? 'Бэлэн' : 'Үнэ дутуу'}</span></td>
              <td className="p-3 text-right"><Button size="sm" variant="outline" className="rounded-lg" disabled={busy || !item.salePrice} onClick={() => void publishOne(item.id)}>{item.published ? 'Шинэчлэх' : 'Нийтлэх'}</Button></td>
            </tr>)}</tbody>
          </table>
          {!data.items.length ? <div className="p-10 text-center text-sm text-[#5B7290]">Каталог хоосон байна. G2G API тохируулбал “G2G каталог sync”, эсвэл CSV import ашиглана.</div> : null}
        </div>
      </div>
    </div>
  )
}
