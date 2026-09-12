'use client'

import { useState } from 'react'
import { ExternalLink, Loader2, ShoppingCart, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function G2GManualProductCard() {
  const [form, setForm] = useState({
    name: '',
    sourceUrl: '',
    sourcePrice: '',
    sourceCurrency: 'USD',
    serviceName: 'G2G Marketplace',
    brandName: '',
    regionName: 'Global',
    salePrice: '',
  })
  const [busy, setBusy] = useState(false)
  const [lastPrice, setLastPrice] = useState<number | null>(null)

  const submit = async () => {
    if (!form.name.trim() || !form.sourceUrl.trim() || !form.sourcePrice) {
      toast.error('Нэр, G2G URL, өртөг заавал оруулна')
      return
    }
    setBusy(true)
    try {
      const saveRes = await fetch('/api/admin/suppliers/g2g/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          sourcePrice: Number(form.sourcePrice),
          salePrice: form.salePrice ? Number(form.salePrice) : null,
        }),
      })
      const saved = await saveRes.json()
      if (!saveRes.ok) throw new Error(saved.error || 'G2G бараа хадгалж чадсангүй')

      const publishRes = await fetch('/api/admin/suppliers/g2g/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [saved.itemId] }),
      })
      const published = await publishRes.json()
      if (!publishRes.ok) throw new Error(published.error || 'Дэлгүүрт нийтэлж чадсангүй')

      setLastPrice(Number(saved.salePrice))
      toast.success('G2G бараа Socialtool.store дээр нийтлэгдлээ')
      setForm(current => ({ ...current, name: '', sourceUrl: '', sourcePrice: '', brandName: '', salePrice: '' }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'G2G бараа нэмэхэд алдаа')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mb-5 rounded-2xl border border-[#B9D7FF] bg-gradient-to-br from-[#F4F9FF] to-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingCart className="size-5 text-[#1677FF]" />
            <h2 className="text-lg font-extrabold text-[#102A43]">G2G Manual Reseller</h2>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-[#5B7290]">
            G2G дээрээс бүтээгдэхүүнээ өөрөө сонгоно. URL + өртгийг оруулахад Socialtool.store дээр өөрийн үнээр шууд нийтэлнэ. API, scraping шаардлагагүй.
          </p>
        </div>
        <a href="https://www.g2g.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B4DBA] hover:underline">
          G2G нээх <ExternalLink className="size-3.5" />
        </a>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs font-semibold text-[#5B7290] xl:col-span-2">
          Бүтээгдэхүүний нэр *
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 h-10 w-full rounded-xl border border-[#D6E4FF] bg-white px-3 text-sm text-[#102A43]" placeholder="Steam Wallet 10 USD" />
        </label>
        <label className="text-xs font-semibold text-[#5B7290] xl:col-span-2">
          G2G бүтээгдэхүүний URL *
          <input type="url" value={form.sourceUrl} onChange={e => setForm({ ...form, sourceUrl: e.target.value })} className="mt-1 h-10 w-full rounded-xl border border-[#D6E4FF] bg-white px-3 text-sm text-[#102A43]" placeholder="https://www.g2g.com/..." />
        </label>
        <label className="text-xs font-semibold text-[#5B7290]">
          G2G өртөг *
          <input type="number" min="0" step="0.01" value={form.sourcePrice} onChange={e => setForm({ ...form, sourcePrice: e.target.value })} className="mt-1 h-10 w-full rounded-xl border border-[#D6E4FF] bg-white px-3 text-sm" placeholder="8.40" />
        </label>
        <label className="text-xs font-semibold text-[#5B7290]">
          Валют
          <input value={form.sourceCurrency} onChange={e => setForm({ ...form, sourceCurrency: e.target.value.toUpperCase() })} maxLength={8} className="mt-1 h-10 w-full rounded-xl border border-[#D6E4FF] bg-white px-3 text-sm uppercase" placeholder="USD" />
        </label>
        <label className="text-xs font-semibold text-[#5B7290]">
          Зарах үнэ ₮ (опц)
          <input type="number" min="1" step="1" value={form.salePrice} onChange={e => setForm({ ...form, salePrice: e.target.value })} className="mt-1 h-10 w-full rounded-xl border border-[#D6E4FF] bg-white px-3 text-sm" placeholder="Хоосон = ханш + markup" />
        </label>
        <label className="text-xs font-semibold text-[#5B7290]">
          Ангилал
          <input value={form.serviceName} onChange={e => setForm({ ...form, serviceName: e.target.value })} className="mt-1 h-10 w-full rounded-xl border border-[#D6E4FF] bg-white px-3 text-sm" placeholder="Gift Cards" />
        </label>
        <label className="text-xs font-semibold text-[#5B7290]">
          Брэнд / платформ
          <input value={form.brandName} onChange={e => setForm({ ...form, brandName: e.target.value })} className="mt-1 h-10 w-full rounded-xl border border-[#D6E4FF] bg-white px-3 text-sm" placeholder="Steam" />
        </label>
        <label className="text-xs font-semibold text-[#5B7290]">
          Region
          <input value={form.regionName} onChange={e => setForm({ ...form, regionName: e.target.value })} className="mt-1 h-10 w-full rounded-xl border border-[#D6E4FF] bg-white px-3 text-sm" placeholder="Global / US / EU" />
        </label>
        <div className="flex items-end md:col-span-2 xl:col-span-2">
          <Button onClick={submit} disabled={busy} className="h-10 w-full rounded-xl bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Бараа үүсгээд нийтлэх
          </Button>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
        Хэрэглэгч төлсний дараа Admin → <b>G2G хүргэлт</b> хэсгээс эх сурвалжийн линкийг нээж G2G дээр гараар худалдаж авна. Дараа нь key/code-оо оруулж хэрэглэгчид хүргэнэ.
      </div>
      {lastPrice ? <div className="mt-2 text-xs font-semibold text-emerald-700">Сүүлд нийтэлсэн зарах үнэ: {lastPrice.toLocaleString('en-US')} ₮</div> : null}
    </div>
  )
}
