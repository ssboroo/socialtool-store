'use client'

import { useEffect, useState } from 'react'
import { Calculator, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

type Preview = {
  ok: boolean
  apply: boolean
  markupPercent: number
  stats: {
    totalG2G: number
    withSourcePrice: number
    calculable: number
    changed: number
    unchanged: number
    linkedProducts: number
    unlinkedCatalogItems: number
    missingSourcePrice: number
  }
  missingRates: Record<string, number>
  sample: Array<{
    id: string
    name: string
    sourcePrice: number
    sourceCurrency: string
    rate: number
    oldSalePrice: number | null
    newSalePrice: number
    linkedToStore: boolean
  }>
}

function ratesToText(rates: Record<string, number>) {
  return Object.entries(rates)
    .filter(([code]) => code !== 'MNT')
    .map(([code, rate]) => `${code}=${rate}`)
    .join('\n')
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

function money(value: number | null) {
  return value == null ? '—' : `${Math.round(value).toLocaleString('en-US')} ₮`
}

export function G2GRepriceCard() {
  const [markup, setMarkup] = useState('100')
  const [rates, setRates] = useState('USD=3600')
  const [preview, setPreview] = useState<Preview | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/api/admin/suppliers/g2g?limit=10', { cache: 'no-store' })
      .then(async response => {
        const body = await response.json()
        if (!response.ok) throw new Error(body.error || 'Үнэ тохиргоо уншиж чадсангүй')
        if (!active) return
        setRates(ratesToText(body.config?.currencyRates || { USD: 3600 }))
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  const requestReprice = async (apply: boolean) => {
    const markupPercent = Number(markup)
    if (!Number.isFinite(markupPercent) || markupPercent < 0 || markupPercent > 300) {
      toast.error('Markup 0–300% хооронд байна')
      return
    }

    setBusy(true)
    try {
      const response = await fetch('/api/admin/suppliers/g2g/reprice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apply, markupPercent, currencyRates: textToRates(rates) }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Үнэ дахин тооцоолох алдаа')
      setPreview(body)
      if (apply) toast.success(`${body.stats.changed} G2G үнэ дахин тооцоологдлоо · ${body.stats.linkedProducts} дэлгүүрийн бараа шинэчлэгдлээ`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Үнэ дахин тооцоолох алдаа')
    } finally {
      setBusy(false)
    }
  }

  const apply = async () => {
    if (!preview) return
    const missing = Object.keys(preview.missingRates).length
    const message = [
      `${preview.stats.changed} G2G барааны үнийг шинэчилнэ.`,
      `${preview.stats.linkedProducts} дэлгүүрийн бараанд шууд үйлчилнэ.`,
      preview.stats.unlinkedCatalogItems ? `${preview.stats.unlinkedCatalogItems} catalog мөр дэлгүүрийн Product-той холбоогүй байна.` : '',
      preview.stats.missingSourcePrice ? `${preview.stats.missingSourcePrice} мөр sourcePrice-гүй тул алгасана.` : '',
      missing ? `Ханшгүй валют байна: ${Object.entries(preview.missingRates).map(([code, count]) => `${code} (${count})`).join(', ')}` : '',
      '',
      'Үргэлжлүүлэх үү?',
    ].filter(Boolean).join('\n')
    if (!window.confirm(message)) return
    await requestReprice(true)
  }

  return (
    <section className="mb-5 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-[#102A43]"><Calculator className="size-5 text-[#1677FF]" /><h3 className="text-lg font-extrabold">G2G үнийг өртгөөс дахин тооцоолох</h3></div>
          <p className="mt-1 text-sm text-[#5B7290]">G2G sourcePrice × валютын ханш × (1 + markup). <b>100% markup</b> гэдэг нь өртгийг 2× болгож зарах буюу өртөг 10,000₮ бол зарах үнэ 20,000₮ гэсэн үг. Энэ нь 50% gross margin-тай тэнцэнэ.</p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-white px-4 py-3 text-xs text-[#5B7290]">
          Үнэ 100₮-өөр дээш тоймлогдоно.<br />Зөвхөн хадгалсан G2G sourcePrice-тэй бараанд үйлчилнэ.
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[180px_1fr_auto] md:items-end">
        <label className="text-xs font-semibold text-[#5B7290]">Markup %
          <Input className="mt-1 bg-white" type="number" min="0" max="300" step="1" value={markup} onChange={e => { setMarkup(e.target.value); setPreview(null) }} />
        </label>
        <label className="text-xs font-semibold text-[#5B7290]">Валютын ханш — 1 нэгж = хэдэн ₮
          <textarea className="mt-1 min-h-10 w-full rounded-md border border-input bg-white px-3 py-2 font-mono text-sm" rows={2} value={rates} onChange={e => { setRates(e.target.value); setPreview(null) }} placeholder={'USD=3600\nEUR=4200'} />
        </label>
        <Button type="button" variant="outline" disabled={busy} onClick={() => requestReprice(false)} className="gap-2">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} Урьдчилан харах
        </Button>
      </div>

      {preview ? <div className="mt-4 space-y-3">
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ['G2G нийт', preview.stats.totalG2G],
            ['Өртөгтэй', preview.stats.withSourcePrice],
            ['Шинэчлэх', preview.stats.changed],
            ['Product холбоотой', preview.stats.linkedProducts],
            ['Source price дутуу', preview.stats.missingSourcePrice],
            ['Холбоогүй', preview.stats.unlinkedCatalogItems],
          ].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-blue-100 bg-white p-3"><div className="text-[11px] font-semibold text-[#5B7290]">{label}</div><div className="mt-1 text-lg font-extrabold text-[#102A43]">{value}</div></div>)}
        </div>

        {Object.keys(preview.missingRates).length ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Ханш дутуу: {Object.entries(preview.missingRates).map(([code, count]) => `${code} (${count})`).join(', ')}. Дээр ханшийг нэмээд дахин preview хийнэ үү.</div> : null}

        {preview.sample.length ? <div className="max-h-64 overflow-auto rounded-xl border border-blue-100 bg-white"><table className="w-full min-w-[720px] text-left text-xs"><thead className="sticky top-0 bg-[#F5F9FF]"><tr><th className="p-2">Бараа</th><th className="p-2">G2G өртөг</th><th className="p-2">Одоогийн үнэ</th><th className="p-2">Шинэ үнэ</th><th className="p-2">Store</th></tr></thead><tbody>{preview.sample.map(item => <tr key={item.id} className="border-t border-blue-50"><td className="p-2 font-semibold text-[#102A43]">{item.name}</td><td className="p-2">{item.sourcePrice} {item.sourceCurrency}</td><td className="p-2">{money(item.oldSalePrice)}</td><td className="p-2 font-bold text-[#0B4DBA]">{money(item.newSalePrice)}</td><td className="p-2">{item.linkedToStore ? 'Шууд шинэчлэгдэнэ' : 'Catalog only'}</td></tr>)}</tbody></table></div> : <p className="text-sm text-[#5B7290]">Өөрчлөх үнэ олдсонгүй.</p>}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#5B7290]">Анхаар: Product-той холбоогүй эсвэл sourcePrice хадгалагдаагүй барааг энэ үйлдэл таамгаар өөрчлөхгүй.</p>
          <Button type="button" disabled={busy || !preview.stats.calculable || Object.keys(preview.missingRates).length > 0} onClick={apply} className="bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white">
            {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null} {markup}% markup хэрэгжүүлэх
          </Button>
        </div>
      </div> : null}
    </section>
  )
}
