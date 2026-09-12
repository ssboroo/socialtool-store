'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, ExternalLink, Link2, Loader2, RefreshCw, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type FeedStatus = {
  configured: boolean
  supplierName: string
  defaultCurrency: string
  feedHost: string | null
  lastSyncedAt: string | null
  maxRows: number
  defaultAllowedHost: string
  extraAllowedHostsConfigured: boolean
}

type SyncResult = {
  supplierName: string
  format: 'csv' | 'xml'
  feedHost: string
  parsedRows: number
  synced: number
  priced: number
  missingCurrencies: string[]
  markupPercent: number
  lastSyncedAt: string
}

export function SupplierFeedCard() {
  const [status, setStatus] = useState<FeedStatus | null>(null)
  const [supplierName, setSupplierName] = useState('ENEBA')
  const [feedUrl, setFeedUrl] = useState('')
  const [defaultCurrency, setDefaultCurrency] = useState('EUR')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<SyncResult | null>(null)

  const load = async () => {
    const res = await fetch('/api/admin/suppliers/feed', { cache: 'no-store' })
    const body = await res.json()
    if (!res.ok) throw new Error(body.error || 'Feed төлөв уншиж чадсангүй')
    setStatus(body)
    setSupplierName(body.supplierName || 'ENEBA')
    setDefaultCurrency(body.defaultCurrency || 'EUR')
  }

  useEffect(() => {
    load().catch(error => toast.error(error instanceof Error ? error.message : 'Feed төлөвийн алдаа'))
  }, [])

  const sync = async () => {
    if (!feedUrl.trim() && !status?.configured) {
      toast.error('Eneba эсвэл supplier-ийн XML/CSV Feed URL оруулна уу')
      return
    }
    setBusy(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/suppliers/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierName,
          feedUrl: feedUrl.trim() || undefined,
          defaultCurrency,
        }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Feed sync алдаа')
      setResult(body)
      setFeedUrl('')
      toast.success(`${body.synced} бүтээгдэхүүн feed-ээс синк хийгдлээ`)
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Feed sync алдаа')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mb-5 rounded-2xl border border-[#D6E4FF] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link2 className="size-5 text-[#1677FF]" />
            <h2 className="text-lg font-extrabold text-[#102A43]">API-гүй XML / CSV Feed</h2>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-[#5B7290]">
            Eneba Affiliate эсвэл зөвшөөрөлтэй supplier-ийн feed URL-ийг нэг удаа холбоод бүтээгдэхүүн, үнэ, stock-ийг Supplier Catalog руу синк хийнэ.
          </p>
        </div>
        <a
          href="https://www.eneba.com/become-affiliate"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B4DBA] hover:underline"
        >
          Eneba Affiliate <ExternalLink className="size-3.5" />
        </a>
      </div>

      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
        <div className="flex gap-2">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
          <div>
            <b>Зөвхөн өөрт тань олгосон/ашиглах эрхтэй feed ашиглана.</b>
            <p className="mt-1 opacity-80">*.eneba.com default-аар зөвшөөрөгдөнө. Өөр supplier host бол Railway → SUPPLIER_FEED_ALLOWED_HOSTS-д domain-оо нэмнэ.</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[0.7fr_1.8fr_0.55fr_auto]">
        <div>
          <label className="text-xs font-semibold text-[#5B7290]">Supplier нэр</label>
          <input
            value={supplierName}
            onChange={e => setSupplierName(e.target.value)}
            maxLength={60}
            className="mt-1 h-10 w-full rounded-xl border border-[#D6E4FF] px-3 text-sm"
            placeholder="ENEBA"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5B7290]">XML / CSV Feed URL</label>
          <input
            value={feedUrl}
            onChange={e => setFeedUrl(e.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-[#D6E4FF] px-3 text-sm"
            placeholder={status?.configured ? `Хадгалсан: ${status.feedHost || 'feed'} — хоосон үлдээвэл saved feed sync хийнэ` : 'https://.../products.xml'}
            type="url"
            autoComplete="off"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5B7290]">Default валют</label>
          <input
            value={defaultCurrency}
            onChange={e => setDefaultCurrency(e.target.value.toUpperCase())}
            maxLength={8}
            className="mt-1 h-10 w-full rounded-xl border border-[#D6E4FF] px-3 text-sm uppercase"
            placeholder="EUR"
          />
        </div>
        <div className="flex items-end">
          <Button onClick={sync} disabled={busy} className="h-10 w-full rounded-xl bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] lg:w-auto">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            {status?.configured && !feedUrl.trim() ? 'Saved feed sync' : 'Feed холбоод sync'}
          </Button>
        </div>
      </div>

      {status?.configured ? (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#5B7290]">
          <span className="inline-flex items-center gap-1"><CheckCircle2 className="size-3.5 text-emerald-600" /> Saved feed: <b>{status.feedHost}</b></span>
          <span>Supplier: <b>{status.supplierName}</b></span>
          <span>Default валют: <b>{status.defaultCurrency}</b></span>
          {status.lastSyncedAt ? <span>Last sync: <b>{new Date(status.lastSyncedAt).toLocaleString()}</b></span> : null}
        </div>
      ) : null}

      {result ? (
        <div className="mt-4 rounded-xl bg-[#F5F9FF] p-3 text-xs text-[#102A43]">
          <b>{result.synced} бүтээгдэхүүн синк</b> · {result.priced} нь зарах үнэтэй · {result.format.toUpperCase()} · markup {result.markupPercent}%
          {result.missingCurrencies.length ? (
            <p className="mt-1 text-amber-700">Ханш дутуу: {result.missingCurrencies.join(', ')}. Доорх “Үнэ тооцоолол” хэсэгт ханшаа нэмээд feed-ээ дахин sync хийнэ.</p>
          ) : null}
          <p className="mt-1 text-[#5B7290]">Шинэ барааг доорх Supplier Catalog хэсгээс шалгаад “Бүгдийг нийтлэх” дарна.</p>
        </div>
      ) : null}
    </div>
  )
}
