'use client'

import { useMemo, useRef, useState } from 'react'
import { Download, FileSpreadsheet, Images, Loader2, UploadCloud, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

type Category = { id: string; name: string; slug: string }
type Row = Record<string, string>
type ImportMode = 'skip' | 'update' | 'create'

const COLUMNS = [
  'name', 'category', 'price', 'oldPrice', 'shortDesc', 'description', 'duration', 'features',
  'image', 'icon', 'available', 'featured', 'tutorialVideoUrl', 'instructionImages',
] as const

const HEADER_ALIASES: Record<string, string> = {
  name: 'name', нэр: 'name', baraa: 'name',
  category: 'category', ангилал: 'category',
  price: 'price', үнэ: 'price',
  oldprice: 'oldPrice', 'хуучинүнэ': 'oldPrice',
  shortdesc: 'shortDesc', товч: 'shortDesc', 'товчтайлбар': 'shortDesc',
  description: 'description', тайлбар: 'description',
  duration: 'duration', хугацаа: 'duration',
  features: 'features', боломж: 'features', боломжууд: 'features',
  image: 'image', зураг: 'image',
  icon: 'icon', дүрс: 'icon',
  available: 'available', бэлэн: 'available',
  featured: 'featured', онцлох: 'featured',
  tutorialvideourl: 'tutorialVideoUrl', video: 'tutorialVideoUrl', видео: 'tutorialVideoUrl',
  instructionimages: 'instructionImages', зааварзураг: 'instructionImages',
}

function normalizeHeader(value: string) {
  return value.replace(/^\uFEFF/, '').trim().toLowerCase().replace(/[\s_-]+/g, '')
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++ }
      else quoted = !quoted
    } else if (ch === ',' && !quoted) {
      row.push(cell); cell = ''
    } else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell); cell = ''
      if (row.some(v => v.trim())) rows.push(row)
      row = []
    } else cell += ch
  }
  row.push(cell)
  if (row.some(v => v.trim())) rows.push(row)
  return rows
}

function toRows(text: string): Row[] {
  const matrix = parseCsv(text)
  if (matrix.length < 2) return []
  const headers = matrix[0].map(h => HEADER_ALIASES[normalizeHeader(h)] || h.trim())
  return matrix.slice(1).map(values => Object.fromEntries(headers.map((h, i) => [h, (values[i] || '').trim()])))
}

function money(value: string) {
  return Number(value.replace(/[₮,\s]/g, ''))
}

function normalizeFile(value: string) {
  return value.trim().toLowerCase().replace(/^.*[\\/]/, '')
}

function stem(value: string) {
  return normalizeFile(value).replace(/\.[a-z0-9]+$/i, '')
}

function durationValue(value: string) {
  const text = value.trim()
  if (!text) return null
  if (text.startsWith('[')) return text
  const parts = text.split(';').map(v => v.trim()).filter(Boolean)
  const priced = parts.map(part => {
    const split = part.lastIndexOf(':')
    if (split < 1) return null
    const term = part.slice(0, split).trim()
    const price = money(part.slice(split + 1))
    return term && Number.isSafeInteger(price) && price > 0 ? { term, price } : null
  })
  if (priced.every(Boolean)) return JSON.stringify(priced)
  return parts.join(';')
}

export function ProductBulkImport({ token, categories, onImported }: {
  token: string
  categories: Category[]
  onImported: () => void
}) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<Row[]>([])
  const [filename, setFilename] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [imageMap, setImageMap] = useState<Record<string, string>>({})
  const [mode, setMode] = useState<ImportMode>('skip')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const csvRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLInputElement>(null)

  const categorySet = useMemo(() => new Set(categories.flatMap(c => [c.name.toLowerCase(), c.slug.toLowerCase()])), [categories])
  const validation = useMemo(() => rows.map((row, index) => {
    const errors: string[] = []
    if (!row.name?.trim()) errors.push('Нэр дутуу')
    if (!row.category?.trim() || !categorySet.has(row.category.trim().toLowerCase())) errors.push('Ангилал олдсонгүй')
    const price = money(row.price || '')
    if (!Number.isSafeInteger(price) || price <= 0) errors.push('Үнэ буруу')
    const oldPrice = row.oldPrice ? money(row.oldPrice) : null
    if (oldPrice !== null && (!Number.isSafeInteger(oldPrice) || oldPrice <= price)) errors.push('Хуучин үнэ буруу')
    return { index, errors }
  }), [rows, categorySet])
  const invalidCount = validation.filter(v => v.errors.length).length

  const readCsv = async (file: File) => {
    if (/\.xlsx?$/i.test(file.name)) {
      setMessage('Excel дээр File → Save As → CSV UTF-8 (.csv) гэж хадгалаад оруулна уу. Ингэвэл Монгол текст алдагдахгүй.')
      setRows([])
      return
    }
    if (!/\.csv$/i.test(file.name)) {
      setMessage('CSV файл сонгоно уу')
      return
    }
    const parsed = toRows(await file.text()).slice(0, 300)
    setFilename(file.name)
    setRows(parsed)
    setMessage(parsed.length ? '' : 'CSV дотор өгөгдөл олдсонгүй')
  }

  const downloadTemplate = () => {
    const sample = [
      COLUMNS.join(','),
      'Google AI Pro 18 сар,AI хэрэгсэл,139999,180000,Google AI Pro эрх,Өөрийн Gmail дээр идэвхжинэ,"1 жил:99999;18 сар:139999",Gemini Pro;Veo;5TB,google-ai.jpg,Package,true,true,,',
      'Autodesk 1 жил,AI хэрэгсэл,89000,120000,Autodesk 46+ программ,Өөрийн Autodesk хаяг дээр идэвхжинэ,1 жил,AutoCAD;Revit;3ds Max,autodesk.jpg,Package,true,false,,',
    ].join('\r\n')
    const blob = new Blob(['\uFEFF' + sample], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'socialtool-products-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const uploadImages = async () => {
    if (!images.length) return imageMap
    const next = { ...imageMap }
    for (let start = 0; start < images.length; start += 4) {
      const chunk = images.slice(start, start + 4)
      await Promise.all(chunk.map(async file => {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/admin/products/upload', { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: fd })
        const data = await res.json()
        if (!res.ok) throw new Error(`${file.name}: ${data.error || 'upload алдаа'}`)
        next[normalizeFile(file.name)] = data.url
        next[stem(file.name)] = data.url
      }))
    }
    setImageMap(next)
    return next
  }

  const runImport = async () => {
    if (!rows.length) return toast.error('CSV файл сонгоно уу')
    if (invalidCount) return toast.error(`${invalidCount} мөрийн алдааг эхлээд засна уу`)
    setBusy(true)
    setMessage('')
    try {
      const uploaded = await uploadImages()
      const payload = rows.map(row => {
        const requestedImage = row.image || ''
        const mappedImage = uploaded[normalizeFile(requestedImage)] || uploaded[stem(requestedImage)] || requestedImage
        return {
          name: row.name,
          category: row.category,
          price: money(row.price || ''),
          oldPrice: row.oldPrice ? money(row.oldPrice) : null,
          shortDesc: row.shortDesc || '',
          description: row.description || row.shortDesc || '',
          duration: durationValue(row.duration || ''),
          features: row.features || '',
          image: mappedImage || null,
          icon: row.icon || 'Package',
          available: row.available === '' || row.available == null ? true : row.available,
          featured: row.featured || false,
          tutorialVideoUrl: row.tutorialVideoUrl || null,
          instructionImages: row.instructionImages || null,
        }
      })
      const res = await fetch('/api/admin/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ mode, rows: payload }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Импорт амжилтгүй')
      const s = data.summary
      setMessage(`Дууслаа: ${s.created} шинэ, ${s.updated} шинэчилсэн, ${s.skipped} алгассан, ${s.errors} алдаа.`)
      if (s.errors) {
        const firstErrors = (data.results as { row: number; error?: string; status: string }[]).filter(r => r.status === 'error').slice(0, 5)
        toast.error(firstErrors.map(r => `${r.row}-р мөр: ${r.error}`).join('\n'))
      } else toast.success(`${s.created + s.updated} бүтээгдэхүүн импортлогдлоо`)
      onImported()
    } catch (e) {
      const text = e instanceof Error ? e.message : 'Импорт хийхэд алдаа гарлаа'
      setMessage(text)
      toast.error(text)
    } finally {
      setBusy(false)
    }
  }

  return <>
    <Button type="button" variant="outline" onClick={() => setOpen(true)} className="rounded-full border-[#D6E4FF] bg-white gap-1.5">
      <FileSpreadsheet className="size-4" /> Бөөнөөр оруулах
    </Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-5xl max-h-[94vh] overflow-y-auto bg-white border-[#D6E4FF]">
        <DialogTitle className="flex items-center gap-2 text-[#102A43]"><FileSpreadsheet className="size-5 text-[#1677FF]" /> Бүтээгдэхүүн бөөнөөр оруулах</DialogTitle>

        <div className="grid gap-3 sm:grid-cols-3">
          <button type="button" onClick={downloadTemplate} className="rounded-2xl border border-[#D6E4FF] bg-[#F8FAFF] p-4 text-left hover:bg-[#EEF4FF]">
            <Download className="size-5 text-[#1677FF]" /><b className="mt-2 block text-sm">1. CSV загвар татах</b><span className="mt-1 block text-xs text-[#5B7290]">Excel-ээр нээгээд мөр бүрт нэг бараа бичнэ.</span>
          </button>
          <button type="button" onClick={() => csvRef.current?.click()} className="rounded-2xl border border-[#D6E4FF] bg-[#F8FAFF] p-4 text-left hover:bg-[#EEF4FF]">
            <UploadCloud className="size-5 text-[#1677FF]" /><b className="mt-2 block text-sm">2. CSV сонгох</b><span className="mt-1 block text-xs text-[#5B7290]">{filename || '300 хүртэл бүтээгдэхүүн'}</span>
          </button>
          <button type="button" onClick={() => imageRef.current?.click()} className="rounded-2xl border border-[#D6E4FF] bg-[#F8FAFF] p-4 text-left hover:bg-[#EEF4FF]">
            <Images className="size-5 text-[#1677FF]" /><b className="mt-2 block text-sm">3. Зургууд сонгох</b><span className="mt-1 block text-xs text-[#5B7290]">{images.length ? `${images.length} зураг сонгосон` : 'Олон зураг зэрэг сонгож болно'}</span>
          </button>
        </div>
        <input ref={csvRef} type="file" accept=".csv,.xlsx,.xls,text/csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) void readCsv(f); e.currentTarget.value = '' }} />
        <input ref={imageRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden" onChange={e => { setImages(Array.from(e.target.files || []).slice(0, 100)); e.currentTarget.value = '' }} />

        <div className="flex flex-col gap-3 rounded-2xl border border-[#D6E4FF] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><b className="text-sm text-[#102A43]">Давхардсан нэртэй бараа</b><p className="text-xs text-[#5B7290]">Нэр яг ижил үед яахыг сонгоно.</p></div>
          <select value={mode} onChange={e => setMode(e.target.value as ImportMode)} className="h-10 rounded-xl border border-[#D6E4FF] bg-white px-3 text-sm">
            <option value="skip">Алгасах</option><option value="update">Одоогийн барааг шинэчлэх</option><option value="create">Шинээр хуулбар үүсгэх</option>
          </select>
        </div>

        {rows.length > 0 && <div className="rounded-2xl border border-[#D6E4FF] overflow-hidden">
          <div className="flex items-center justify-between bg-[#F5F9FF] px-4 py-3 text-sm"><b>{rows.length} мөр</b><span className={invalidCount ? 'text-red-600' : 'text-green-700'}>{invalidCount ? `${invalidCount} алдаатай` : 'Импортод бэлэн'}</span></div>
          <div className="max-h-[320px] overflow-auto custom-scroll">
            <table className="w-full min-w-[760px] text-xs"><thead className="sticky top-0 bg-white"><tr><th className="p-2 text-left">#</th><th className="p-2 text-left">Нэр</th><th className="p-2 text-left">Ангилал</th><th className="p-2 text-right">Үнэ</th><th className="p-2 text-left">Зураг</th><th className="p-2 text-left">Шалгалт</th></tr></thead>
              <tbody className="divide-y divide-[#EEF4FF]">{rows.map((row, i) => { const errors = validation[i]?.errors || []; return <tr key={i} className={errors.length ? 'bg-red-50/60' : ''}><td className="p-2">{i + 2}</td><td className="p-2 font-medium">{row.name || '-'}</td><td className="p-2">{row.category || '-'}</td><td className="p-2 text-right">{row.price || '-'}</td><td className="p-2">{row.image || '-'}</td><td className="p-2">{errors.length ? <span className="text-red-600">{errors.join(', ')}</span> : <span className="text-green-700">OK</span>}</td></tr> })}</tbody>
            </table>
          </div>
        </div>}

        {images.length > 0 && <div className="flex items-center justify-between rounded-xl bg-[#EEF4FF] px-4 py-3 text-sm"><span><b>{images.length}</b> зураг CSV-ийн <code>image</code> файлын нэртэй автоматаар таарна.</span><button type="button" onClick={() => { setImages([]); setImageMap({}) }} aria-label="Зургууд цэвэрлэх"><X className="size-4" /></button></div>}
        {message && <div className="rounded-xl border border-[#D6E4FF] bg-[#F8FAFF] px-4 py-3 whitespace-pre-line text-sm text-[#5B7290]">{message}</div>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>Хаах</Button>
          <Button type="button" onClick={() => void runImport()} disabled={busy || !rows.length || invalidCount > 0} className="bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white gap-2">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />} {busy ? 'Импортолж байна…' : `${rows.length || 0} бараа импортлох`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </>
}
