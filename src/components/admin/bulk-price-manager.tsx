'use client'

import { useEffect, useMemo, useState } from 'react'
import { Calculator, CheckCircle2, Loader2, RefreshCw, Search, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

type Category = { id: string; name: string; slug: string; icon: string }
type ScopeType = 'all' | 'category' | 'supplier' | 'search'
type RuleType = 'percentage' | 'multiplier' | 'fixed' | 'direct' | 'sourceMarkup'

type Preview = {
  ok: boolean
  apply: boolean
  scope: ScopeType
  rule: RuleType
  value: number
  roundTo: number
  stats: {
    matched: number
    changed: number
    unchanged: number
    skipped: number
    linkedSupplier: number
  }
  missingRates: Record<string, number>
  sample: Array<{
    id: string
    name: string
    category: string
    oldPrice: number
    newPrice: number
    delta: number
    deltaPercent: number
    supplier: string | null
    sourcePrice: number | null
    sourceCurrency: string | null
  }>
}

function money(value: number) {
  return `${Math.round(value).toLocaleString('en-US')} ₮`
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

export function BulkPriceManager({ categories }: { categories: Category[] }) {
  const [scope, setScope] = useState<ScopeType>('all')
  const [categoryId, setCategoryId] = useState('')
  const [supplier, setSupplier] = useState('G2G')
  const [search, setSearch] = useState('')
  const [rule, setRule] = useState<RuleType>('percentage')
  const [value, setValue] = useState('10')
  const [roundTo, setRoundTo] = useState('100')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [rates, setRates] = useState('USD=3600')
  const [includeUnavailable, setIncludeUnavailable] = useState(false)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch('/api/admin/suppliers/g2g?limit=10', { cache: 'no-store' })
      .then(async response => {
        const body = await response.json()
        if (!response.ok) return
        const text = ratesToText(body.config?.currencyRates || {})
        if (text) setRates(text)
      })
      .catch(() => {})
  }, [])

  const ruleHelp = useMemo(() => {
    if (rule === 'percentage') return 'Одоогийн үнэ дээр хувиар нэмнэ/хасна. Ж: 10 = +10%, -10 = -10%.'
    if (rule === 'multiplier') return 'Одоогийн үнийг үржүүлнэ. Ж: 1.5 = 50% өсгөнө, 2 = 2 дахин.'
    if (rule === 'fixed') return 'Одоогийн үнэ дээр тогтмол ₮ нэмнэ/хасна. Ж: 5000 эсвэл -5000.'
    if (rule === 'direct') return 'Таарсан бүх бараанд яг ижил зарах үнэ тавина.'
    return 'Supplier sourcePrice × валютын ханш × (1 + markup/100). Source price байхгүй барааг алгасана.'
  }, [rule])

  const clearPreview = () => setPreview(null)

  const request = async (apply: boolean) => {
    const numericValue = Number(value)
    if (!Number.isFinite(numericValue)) return toast.error('Үнэ бодох утга оруулна уу')

    setBusy(true)
    try {
      const response = await fetch('/api/admin/pricing/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apply,
          scope,
          categoryId,
          supplier,
          search,
          rule,
          value: numericValue,
          roundTo: Number(roundTo),
          minPrice: minPrice || null,
          maxPrice: maxPrice || null,
          currencyRates: textToRates(rates),
          includeUnavailable,
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Бөөнөөр үнэ шинэчлэх алдаа')
      setPreview(body)
      if (apply) {
        toast.success(`${body.stats.changed} барааны үнэ шинэчлэгдлээ`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Бөөнөөр үнэ шинэчлэх алдаа')
    } finally {
      setBusy(false)
    }
  }

  const apply = async () => {
    if (!preview?.stats.changed) return
    const missing = Object.entries(preview.missingRates || {})
    const message = [
      `${preview.stats.changed} барааны үнийг бөөнөөр шинэчилнэ.`,
      `Таарсан: ${preview.stats.matched} · Алгассан: ${preview.stats.skipped}`,
      missing.length ? `Ханшгүй валют: ${missing.map(([code, count]) => `${code} (${count})`).join(', ')}` : '',
      '',
      'Үргэлжлүүлэх үү?',
    ].filter(Boolean).join('\n')
    if (!window.confirm(message)) return
    await request(true)
  }

  return (
    <section className="mb-4 overflow-hidden rounded-2xl border border-[#C9DCFF] bg-white shadow-premium">
      <div className="flex flex-col gap-3 border-b border-[#E5EEFF] bg-gradient-to-r from-[#F5F9FF] via-white to-[#F7F3FF] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#1677FF] to-[#6D4AFF] text-white">
              <SlidersHorizontal className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#102A43]">Бөөнөөр үнэ шинэчлэх</h3>
              <p className="text-xs text-[#5B7290]">Бүх бараа, ангилал, supplier эсвэл хайлтын үр дүнд нэг дор үнэ өөрчилнө.</p>
            </div>
          </div>
        </div>
        <div className="rounded-full border border-blue-100 bg-white px-3 py-1.5 text-[11px] font-bold text-[#0B4DBA]">
          Эхлээд Preview → дараа нь Apply
        </div>
      </div>

      <div className="grid gap-4 p-4 xl:grid-cols-[1fr_1.1fr]">
        <div className="space-y-4">
          <div>
            <div className="mb-2 text-xs font-extrabold uppercase tracking-wide text-[#5B7290]">1. Аль бараанууд?</div>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-xs font-semibold text-[#5B7290]">
                Хүрээ
                <select
                  value={scope}
                  onChange={e => { setScope(e.target.value as ScopeType); clearPreview() }}
                  className="mt-1 h-10 w-full rounded-xl border border-[#D6E4FF] bg-white px-3 text-sm text-[#102A43]"
                >
                  <option value="all">Бүх бараа</option>
                  <option value="category">Ангиллаар</option>
                  <option value="supplier">Supplier-аар</option>
                  <option value="search">Нэрээр хайх</option>
                </select>
              </label>

              {scope === 'category' ? (
                <label className="text-xs font-semibold text-[#5B7290]">
                  Ангилал
                  <select
                    value={categoryId}
                    onChange={e => { setCategoryId(e.target.value); clearPreview() }}
                    className="mt-1 h-10 w-full rounded-xl border border-[#D6E4FF] bg-white px-3 text-sm text-[#102A43]"
                  >
                    <option value="">Ангилал сонгох…</option>
                    {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </label>
              ) : null}

              {scope === 'supplier' ? (
                <label className="text-xs font-semibold text-[#5B7290]">
                  Supplier
                  <Input value={supplier} onChange={e => { setSupplier(e.target.value); clearPreview() }} className="mt-1" placeholder="G2G / G2A / CSV" />
                </label>
              ) : null}

              {scope === 'search' ? (
                <label className="text-xs font-semibold text-[#5B7290]">
                  Нэрээр хайх
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5B7290]" />
                    <Input value={search} onChange={e => { setSearch(e.target.value); clearPreview() }} className="pl-9" placeholder="Facebook, Canva, Microsoft..." />
                  </div>
                </label>
              ) : null}
            </div>

            <label className="mt-2 flex items-center gap-2 text-xs font-semibold text-[#102A43]">
              <input
                type="checkbox"
                checked={includeUnavailable}
                onChange={e => { setIncludeUnavailable(e.target.checked); clearPreview() }}
              />
              Идэвхгүй / дууссан барааг мөн хамруулах
            </label>
          </div>

          <div>
            <div className="mb-2 text-xs font-extrabold uppercase tracking-wide text-[#5B7290]">2. Үнэ бодох дүрэм</div>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-xs font-semibold text-[#5B7290]">
                Дүрэм
                <select
                  value={rule}
                  onChange={e => {
                    const next = e.target.value as RuleType
                    setRule(next)
                    if (next === 'sourceMarkup') setValue('100')
                    else if (next === 'multiplier') setValue('1.5')
                    else if (next === 'direct') setValue('39000')
                    else if (next === 'fixed') setValue('5000')
                    else setValue('10')
                    clearPreview()
                  }}
                  className="mt-1 h-10 w-full rounded-xl border border-[#D6E4FF] bg-white px-3 text-sm text-[#102A43]"
                >
                  <option value="percentage">% нэмэх / хасах</option>
                  <option value="multiplier">Үржүүлэх ×</option>
                  <option value="fixed">Тогтмол ₮ нэмэх / хасах</option>
                  <option value="direct">Шууд ижил үнэ тавих</option>
                  <option value="sourceMarkup">Supplier өртгөөс markup</option>
                </select>
              </label>

              <label className="text-xs font-semibold text-[#5B7290]">
                {rule === 'percentage' ? 'Хувь %' : rule === 'multiplier' ? 'Үржүүлэгч' : rule === 'sourceMarkup' ? 'Markup %' : 'Дүн'}
                <Input
                  type="number"
                  step={rule === 'multiplier' ? '0.1' : '1'}
                  value={value}
                  onChange={e => { setValue(e.target.value); clearPreview() }}
                  className="mt-1"
                />
              </label>
            </div>
            <p className="mt-2 rounded-xl bg-[#F5F9FF] px-3 py-2 text-xs text-[#5B7290]">{ruleHelp}</p>
          </div>

          {rule === 'sourceMarkup' ? (
            <label className="block text-xs font-semibold text-[#5B7290]">
              Валютын ханш — 1 нэгж = хэдэн ₮
              <textarea
                value={rates}
                onChange={e => { setRates(e.target.value); clearPreview() }}
                rows={3}
                className="mt-1 w-full rounded-xl border border-[#D6E4FF] bg-white p-3 font-mono text-sm text-[#102A43]"
                placeholder={'USD=3600\nEUR=4200'}
              />
            </label>
          ) : null}

          <div>
            <div className="mb-2 text-xs font-extrabold uppercase tracking-wide text-[#5B7290]">3. Хамгаалалт & тоймлолт</div>
            <div className="grid gap-2 sm:grid-cols-3">
              <label className="text-xs font-semibold text-[#5B7290]">
                Тоймлох
                <select value={roundTo} onChange={e => { setRoundTo(e.target.value); clearPreview() }} className="mt-1 h-10 w-full rounded-xl border border-[#D6E4FF] bg-white px-3 text-sm">
                  <option value="1">Тоймлохгүй</option>
                  <option value="100">100₮-өөр дээш</option>
                  <option value="1000">1,000₮-өөр дээш</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-[#5B7290]">
                Доод үнэ
                <Input type="number" min="1" value={minPrice} onChange={e => { setMinPrice(e.target.value); clearPreview() }} className="mt-1" placeholder="ж: 5000" />
              </label>
              <label className="text-xs font-semibold text-[#5B7290]">
                Дээд үнэ
                <Input type="number" min="1" value={maxPrice} onChange={e => { setMaxPrice(e.target.value); clearPreview() }} className="mt-1" placeholder="опц" />
              </label>
            </div>
          </div>

          <Button type="button" variant="outline" disabled={busy} onClick={() => void request(false)} className="w-full rounded-xl border-[#B9D7FF] py-5 font-bold text-[#0B4DBA]">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} Урьдчилан харах
          </Button>
        </div>

        <div className="min-h-[360px] rounded-2xl border border-[#E5EEFF] bg-[#FAFCFF] p-4">
          {!preview ? (
            <div className="grid h-full min-h-[330px] place-items-center text-center">
              <div>
                <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#E8F1FF] text-[#1677FF]"><Calculator className="size-5" /></div>
                <div className="mt-3 font-bold text-[#102A43]">Шинэ үнийг эхлээд шалгана</div>
                <p className="mx-auto mt-1 max-w-sm text-xs text-[#5B7290]">“Урьдчилан харах” дарахад ямар ч үнэ хадгалагдахгүй. Одоогийн → шинэ үнэ энд харагдана.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ['Таарсан', preview.stats.matched],
                  ['Өөрчлөх', preview.stats.changed],
                  ['Алгассан', preview.stats.skipped],
                  ['Supplier холбоотой', preview.stats.linkedSupplier],
                ].map(([label, count]) => (
                  <div key={String(label)} className="rounded-xl border border-[#E5EEFF] bg-white p-3">
                    <div className="text-[10px] font-bold uppercase text-[#5B7290]">{label}</div>
                    <div className="mt-1 text-xl font-extrabold text-[#102A43]">{count}</div>
                  </div>
                ))}
              </div>

              {Object.keys(preview.missingRates || {}).length ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  Ханш дутуу: {Object.entries(preview.missingRates).map(([code, count]) => `${code} (${count})`).join(', ')}
                </div>
              ) : null}

              <div className="max-h-[360px] overflow-auto rounded-xl border border-[#E5EEFF] bg-white">
                <table className="w-full min-w-[680px] text-left text-xs">
                  <thead className="sticky top-0 bg-[#F5F9FF] text-[#5B7290]">
                    <tr>
                      <th className="p-2">Бараа</th>
                      <th className="p-2">Одоогийн үнэ</th>
                      <th className="p-2">Шинэ үнэ</th>
                      <th className="p-2">Өөрчлөлт</th>
                      <th className="p-2">Supplier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sample.map(item => (
                      <tr key={item.id} className="border-t border-[#EEF4FF]">
                        <td className="max-w-[260px] p-2">
                          <div className="font-semibold text-[#102A43]">{item.name}</div>
                          <div className="text-[10px] text-[#5B7290]">{item.category}</div>
                        </td>
                        <td className="p-2">{money(item.oldPrice)}</td>
                        <td className="p-2 font-bold text-[#0B4DBA]">{money(item.newPrice)}</td>
                        <td className={`p-2 font-bold ${item.delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {item.delta >= 0 ? '+' : ''}{money(item.delta)} · {item.deltaPercent >= 0 ? '+' : ''}{item.deltaPercent.toFixed(1)}%
                        </td>
                        <td className="p-2">{item.supplier || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!preview.sample.length ? <div className="p-8 text-center text-xs text-[#5B7290]">Өөрчлөх үнэ олдсонгүй.</div> : null}
              </div>

              {preview.stats.changed > preview.sample.length ? (
                <div className="text-center text-[11px] text-[#5B7290]">Preview-д эхний {preview.sample.length} мөр · нийт {preview.stats.changed} бараа өөрчлөгдөнө</div>
              ) : null}

              <Button
                type="button"
                disabled={busy || !preview.stats.changed || Object.keys(preview.missingRates || {}).length > 0}
                onClick={() => void apply()}
                className="w-full rounded-xl bg-gradient-to-r from-[#1677FF] to-[#6D4AFF] py-5 text-white"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                {preview.stats.changed} барааны үнийг хэрэгжүүлэх
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
