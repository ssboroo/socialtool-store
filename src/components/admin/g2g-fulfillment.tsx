'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Copy, ExternalLink, KeyRound, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatTugrik } from '@/lib/format'
import { toast } from 'sonner'

type Item = {
  id: string
  productName: string
  quantity: number
  supplierName: string | null
  supplierSourceUrl: string | null
  supplierCost: number | null
  supplierCurrency: string | null
  deliveryCode: string | null
  deliveryNote: string | null
  fulfilledAt: string | null
}

type Order = {
  id: string
  orderNumber: string
  customerName: string
  phone: string
  email: string
  telegram: string | null
  status: string
  paymentStatus: string | null
  totalAmount: number
  createdAt: string
  items: Item[]
}

type Draft = { code: string; note: string }

export function G2GFulfillment() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/fulfillment', { cache: 'no-store' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Хүргэлтийн жагсаалт уншиж чадсангүй')
      const list = Array.isArray(body) ? body as Order[] : []
      setOrders(list)
      const next: Record<string, Draft> = {}
      for (const order of list) for (const item of order.items) next[item.id] = { code: item.deliveryCode || '', note: item.deliveryNote || '' }
      setDrafts(next)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Хүргэлтийн алдаа')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const pendingCount = useMemo(() => orders.reduce((sum, order) => sum + order.items.filter(item => !item.fulfilledAt).length, 0), [orders])

  const saveItem = async (itemId: string) => {
    const draft = drafts[itemId]
    if (!draft?.code.trim()) return toast.error('Key/code оруулна уу')
    setBusyId(itemId)
    try {
      const res = await fetch('/api/admin/fulfillment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fulfill_item', itemId, code: draft.code, note: draft.note }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Key хүргэж чадсангүй')
      toast.success('Key/code хэрэглэгчийн захиалгад хүргэгдлээ')
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Хүргэлтийн алдаа')
    } finally {
      setBusyId(null)
    }
  }

  const markDelivered = async (orderId: string) => {
    setBusyId(orderId)
    try {
      const res = await fetch('/api/admin/fulfillment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_order_delivered', orderId }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Захиалга шинэчилж чадсангүй')
      toast.success('Захиалга хүргэгдсэн төлөвт орлоо')
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Хүргэлтийн алдаа')
    } finally {
      setBusyId(null)
    }
  }

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} хуулагдлаа`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2"><KeyRound className="size-5 text-[#1677FF]" /><h2 className="text-xl font-extrabold text-[#102A43]">G2G хүргэлт</h2></div>
          <p className="mt-1 text-sm text-[#5B7290]">Төлбөр орсон захиалгын G2G линкийг нээгээд бараагаа худалдаж авна → key/code оруулна → хэрэглэгчийн “Миний захиалга” дээр шууд харагдана.</p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading} className="rounded-full"><RefreshCw className="size-4" /> Шинэчлэх</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#D6E4FF] bg-white p-4"><div className="text-xs font-semibold text-[#5B7290]">Supplier захиалга</div><div className="mt-1 text-2xl font-extrabold text-[#102A43]">{orders.length}</div></div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="text-xs font-semibold text-amber-700">Key хүлээгдэж буй</div><div className="mt-1 text-2xl font-extrabold text-amber-900">{pendingCount}</div></div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><div className="text-xs font-semibold text-emerald-700">Горим</div><div className="mt-1 text-base font-extrabold text-emerald-900">Manual procurement</div></div>
      </div>

      {loading ? <div className="grid min-h-56 place-items-center"><Loader2 className="size-7 animate-spin text-[#1677FF]" /></div> : null}
      {!loading && !orders.length ? <div className="rounded-2xl border border-[#D6E4FF] bg-white p-10 text-center text-sm text-[#5B7290]">Одоогоор төлөгдсөн supplier захиалга алга.</div> : null}

      {!loading && orders.map(order => {
        const allDone = order.items.length > 0 && order.items.every(item => item.fulfilledAt)
        return (
          <div key={order.id} className="overflow-hidden rounded-2xl border border-[#D6E4FF] bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-[#EEF4FF] bg-[#F5F9FF]/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2"><span className="font-extrabold text-[#0B4DBA]">#{order.orderNumber}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{order.status}</span></div>
                <p className="mt-1 text-xs text-[#5B7290]">{order.customerName} · {order.phone} · {order.email}{order.telegram ? ` · ${order.telegram}` : ''}</p>
              </div>
              <div className="text-sm font-extrabold text-[#102A43]">{formatTugrik(order.totalAmount)}</div>
            </div>

            <div className="divide-y divide-[#EEF4FF]">
              {order.items.map(item => {
                const draft = drafts[item.id] || { code: '', note: '' }
                return (
                  <div key={item.id} className="p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2"><b className="text-[#102A43]">{item.productName}</b><span className="rounded-full bg-[#E8F1FF] px-2 py-0.5 text-[10px] font-bold text-[#0B4DBA]">{item.supplierName}</span>{item.fulfilledAt ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700"><CheckCircle2 className="size-3" />Хүргэсэн</span> : null}</div>
                        <p className="mt-1 text-xs text-[#5B7290]">Тоо: {item.quantity}{item.supplierCost != null ? ` · Өртөг: ${item.supplierCost} ${item.supplierCurrency || ''}` : ''}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {item.supplierSourceUrl ? <a href={item.supplierSourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#1677FF]/30 bg-[#E8F1FF] px-3 text-xs font-bold text-[#0B4DBA]">G2G-с авах <ExternalLink className="size-3.5" /></a> : <span className="text-xs text-amber-700">Source URL байхгүй</span>}
                        <button type="button" onClick={() => copy(order.email, 'И-мэйл')} className="inline-flex h-9 items-center gap-1 rounded-xl border border-[#D6E4FF] px-3 text-xs font-semibold text-[#5B7290]"><Copy className="size-3.5" /> Email</button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-[1.3fr_1fr_auto]">
                      <textarea value={draft.code} onChange={e => setDrafts(current => ({ ...current, [item.id]: { ...draft, code: e.target.value } }))} rows={3} className="w-full rounded-xl border border-[#D6E4FF] p-3 font-mono text-sm" placeholder={item.quantity > 1 ? 'Key/code-уудыг мөр мөрөөр нь оруулна' : 'Key / code / activation мэдээлэл'} />
                      <textarea value={draft.note} onChange={e => setDrafts(current => ({ ...current, [item.id]: { ...draft, note: e.target.value } }))} rows={3} className="w-full rounded-xl border border-[#D6E4FF] p-3 text-sm" placeholder="Хэрэглэгчид өгөх нэмэлт заавар (опц)" />
                      <div className="flex items-end"><Button onClick={() => void saveItem(item.id)} disabled={busyId === item.id} className="w-full rounded-xl bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] lg:w-auto">{busyId === item.id ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}{item.fulfilledAt ? 'Key шинэчлэх' : 'Key хүргэх'}</Button></div>
                    </div>
                  </div>
                )
              })}
            </div>

            {allDone && order.status !== 'DELIVERED' ? <div className="border-t border-[#EEF4FF] bg-emerald-50 px-5 py-3 text-right"><Button onClick={() => void markDelivered(order.id)} disabled={busyId === order.id} className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">{busyId === order.id ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Захиалгыг хүргэгдсэн болгох</Button></div> : null}
          </div>
        )
      })}
    </div>
  )
}
