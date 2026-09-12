'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2, RefreshCw, ShoppingBag, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type G2AStatus = {
  configured: boolean
  requiredEnv: string[]
  apiUrl: string
  nextPage: number
  eurRateConfigured: boolean
  stats: { total: number; priced: number; lastSyncedAt: string | null }
}

export function G2ASyncCard() {
  const [status, setStatus] = useState<G2AStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')

  const load = async () => {
    const res = await fetch('/api/admin/suppliers/g2a', { cache: 'no-store' })
    const body = await res.json()
    if (!res.ok) throw new Error(body.error || 'G2A төлөв уншиж чадсангүй')
    setStatus(body)
    return body as G2AStatus
  }

  useEffect(() => {
    let active = true
    fetch('/api/admin/suppliers/g2a', { cache: 'no-store' })
      .then(async res => {
        const body = await res.json()
        if (!res.ok) throw new Error(body.error || 'G2A төлөв уншиж чадсангүй')
        if (active) setStatus(body)
      })
      .catch(error => { if (active) toast.error(error instanceof Error ? error.message : 'G2A төлөвийн алдаа') })
    return () => { active = false }
  }, [])

  const sync = async (reset = false) => {
    if (!status?.configured) {
      toast.info('Эхлээд G2A Export API credentials-ээ Railway Variables дээр тохируулна уу')
      return
    }
    setBusy(true)
    let synced = 0
    try {
      for (let index = 0; index < 5; index += 1) {
        const res = await fetch('/api/admin/suppliers/g2a', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reset: reset && index === 0 }),
        })
        const body = await res.json()
        if (!res.ok) throw new Error(body.error || 'G2A sync алдаа')
        synced += Number(body.synced || 0)
        setProgress(`G2A: ${synced} бүтээгдэхүүн · page ${body.page}/${Math.max(body.page, Math.ceil((body.totalResults || 0) / 100))}`)
        if (!body.hasNext) break
      }
      toast.success(`${synced} G2A бүтээгдэхүүн синк хийгдлээ`)
      await load()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'G2A sync алдаа'
      setProgress(message)
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mb-5 rounded-2xl border border-[#D6E4FF] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-5 text-[#1677FF]" />
            <h2 className="text-lg font-extrabold text-[#102A43]">G2A Export API</h2>
            {status?.configured
              ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700">ХОЛБОГДСОН</span>
              : <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-700">CREDENTIAL ХҮЛЭЭЖ БАЙНА</span>}
          </div>
          <p className="mt-1 text-sm text-[#5B7290]">G2A marketplace-ийн Export API-аас бүтээгдэхүүн, хамгийн бага үнэ, stock, platform, region, зураг татаж Supplier Catalog-д синк хийнэ.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-full" onClick={() => void load()} disabled={busy}>
            <RefreshCw className="size-4" /> Төлөв шалгах
          </Button>
          <Button className="rounded-full bg-gradient-to-r from-[#1677FF] to-[#0B4DBA]" onClick={() => void sync(false)} disabled={busy || !status?.configured}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ShoppingBag className="size-4" />} Дараагийн 500 sync
          </Button>
          <Button variant="outline" className="rounded-full" onClick={() => void sync(true)} disabled={busy || !status?.configured}>
            Эхнээс нь sync
          </Button>
        </div>
      </div>

      {status ? (
        <div className={`mt-4 rounded-xl border p-3 text-sm ${status.configured ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
          <div className="flex gap-2">
            {status.configured ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <TriangleAlert className="mt-0.5 size-4 shrink-0" />}
            <div>
              {status.configured ? (
                <>
                  <b>G2A API ашиглахад бэлэн.</b>
                  <div className="mt-1 text-xs opacity-80">Каталог: {status.stats.total.toLocaleString()} · Үнэтэй: {status.stats.priced.toLocaleString()} · Дараагийн page: {status.nextPage}</div>
                  {!status.eurRateConfigured ? <div className="mt-1 text-xs font-bold">Supplier үнэ тооцоолол дээр EUR ханш оруулбал ₮ зарах үнэ автоматаар бодогдоно.</div> : null}
                </>
              ) : (
                <>
                  <b>G2A Business verified account + Export API credentials шаардлагатай.</b>
                  <div className="mt-1 text-xs opacity-80">Railway Variables: {status.requiredEnv.join(', ')} · optional: G2A_API_URL={status.apiUrl}</div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
      {progress ? <div className="mt-3 rounded-xl bg-[#F5F9FF] px-3 py-2 text-xs font-semibold text-[#0B4DBA]">{progress}</div> : null}
    </div>
  )
}
