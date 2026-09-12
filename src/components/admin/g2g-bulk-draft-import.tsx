'use client'

import { useMemo, useRef, useState } from 'react'
import { FileUp, Loader2, PackagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type BulkRow = {
  serviceName: string
  name: string
  sourceUrl: string
  sourcePrice?: string
  sourceCurrency?: string
  salePrice?: string
}

function cleanUrl(value: string) {
  return value.trim().replace(/\\/g, '')
}

function parseMarkdownTable(text: string) {
  const rows: BulkRow[] = []
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || !line.includes('|')) continue
    const cells = line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(v => v.trim())
    if (cells.length < 3) continue
    if (cells[0].replace(/[-:]/g, '').trim() === '') continue
    const [serviceName, name, rawUrl, sourcePrice = '', sourceCurrency = 'USD', salePrice = ''] = cells
    const sourceUrl = cleanUrl(rawUrl)
    if (!name || !sourceUrl) continue
    try {
      const url = new URL(sourceUrl)
      const host = url.hostname.toLowerCase()
      if (url.protocol !== 'https:' || !(host === 'g2g.com' || host.endsWith('.g2g.com'))) continue
    } catch { continue }
    rows.push({ serviceName: serviceName || 'G2G Marketplace', name, sourceUrl, sourcePrice, sourceCurrency, salePrice })
  }
  return rows
}

export function G2GBulkDraftImport() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<BulkRow[]>([])
  const [fileName, setFileName] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState('')

  const preview = useMemo(() => rows.slice(0, 5), [rows])

  const readFile = async (file: File) => {
    const text = await file.text()
    const parsed = parseMarkdownTable(text)
    if (!parsed.length) {
      toast.error('G2G markdown хүснэгтийн мөр олдсонгүй')
      setRows([])
      setFileName('')
      return
    }
    setRows(parsed.slice(0, 500))
    setFileName(file.name)
    setResult('')
    toast.success(`${Math.min(parsed.length, 500)} G2G бараа танигдлаа`)
  }

  const importRows = async () => {
    if (!rows.length) return toast.error('Эхлээд жагсаалтын файл сонгоно уу')
    setBusy(true)
    try {
      const res = await fetch('/api/admin/suppliers/g2g/manual/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Импорт алдаа')
      const summary = body.summary || {}
      const message = `${summary.created || 0} шинэ · ${summary.updated || 0} шинэчилсэн · ${summary.priced || 0} үнэтэй · ${summary.drafts || 0} үнэ дутуу · ${summary.errors || 0} алдаа`
      setResult(message)
      if (summary.errors) toast.error(message)
      else toast.success(`G2G жагсаалт импортлогдлоо: ${message}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'G2G импорт алдаа')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mb-5 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <PackagePlus className="size-5 text-violet-600" />
            <h2 className="text-lg font-extrabold text-[#102A43]">G2G жагсаалтыг бөөнөөр импортлох</h2>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-[#5B7290]">
            Category | Product name | G2G URL гэсэн markdown хүснэгтийг нэг дор уншаад Supplier Catalog-д draft болгон оруулна. Үнэ байгаа бол 4-р багана sourcePrice, 5-р багана currency, 6-р багана salePrice байж болно.
          </p>
        </div>
        <Button variant="outline" className="rounded-xl" onClick={() => fileRef.current?.click()} disabled={busy}>
          <FileUp className="size-4" /> Файл сонгох
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".md,.txt,text/plain,text/markdown"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) void readFile(file)
            e.currentTarget.value = ''
          }}
        />
      </div>

      {rows.length ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-violet-200 bg-white p-3 text-sm">
            <b>{fileName}</b> · <span className="text-violet-700 font-bold">{rows.length} бараа</span>
            <div className="mt-2 space-y-1 text-xs text-[#5B7290]">
              {preview.map((row, index) => <div key={`${row.sourceUrl}-${index}`} className="truncate">{index + 1}. {row.serviceName} · {row.name}</div>)}
              {rows.length > preview.length ? <div>… +{rows.length - preview.length} бараа</div> : null}
            </div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Таны одоогийн файлд үнэ байхгүй бол бараанууд <b>“Үнэ дутуу” draft</b> байдлаар орно. Худалдан авагчид харагдуулахын өмнө өртөг/зарах үнийг тохируулна.
          </div>
          <Button onClick={importRows} disabled={busy} className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-[#1677FF] text-white">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <PackagePlus className="size-4" />}
            {rows.length} барааг Supplier Catalog-д шууд оруулах
          </Button>
          {result ? <div className="rounded-xl bg-[#F5F9FF] px-3 py-2 text-xs font-semibold text-[#0B4DBA]">{result}</div> : null}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-violet-200 bg-white/70 p-4 text-center text-xs text-[#5B7290]">
          Таны явуулсан шиг <b>.md</b> файлаа сонгоход бүх мөрийг автоматаар танина.
        </div>
      )}
    </div>
  )
}
