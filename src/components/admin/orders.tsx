'use client'

import { useEffect, useState } from 'react'
import {
  Loader2, Phone, Mail, Send, Copy, CheckCircle2, XCircle, Package, Eye, Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogTitle,
} from '@/components/ui/dialog'
import { formatTugrik, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface OrderItem {
  id: string
  productId: string
  productName: string
  price: number
  quantity: number
}
interface Order {
  id: string
  orderNumber: string
  customerName: string
  phone: string
  email: string
  telegram: string | null
  totalAmount: number
  status: string
  createdAt: string
  items: OrderItem[]
  payment: { status: string; invoiceNumber: string | null; amount: number; paidAt: string | null; wireTransactionId: string | null } | null
}

const STATUSES = ['all', 'PENDING_PAYMENT', 'PAID', 'DELIVERED', 'CANCELLED']

export function AdminOrders({ token }: { token: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<Order | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filter !== 'all') params.set('status', filter)
    fetch(`/api/admin/orders?${params}`, { headers: { authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setOrders(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
     
  }, [filter, token])

  const openDetail = (o: Order) => {
    setSelected(o)
    fetch(`/api/admin/orders/${o.id}`, { headers: { authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setSelected(d))
      .catch(() => {})
  }

  const action = async (orderId: string, actionName: string) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: actionName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Амжилттай шинэчлэгдлээ')
      if (selected?.id === orderId) {
        setSelected({ ...selected, status: data.status })
      }
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Алдаа')
    } finally {
      setActionLoading(false)
    }
  }

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} хуулагдлаа`)
  }

  const filtered = orders.filter((o) =>
    !q ||
    o.orderNumber.toLowerCase().includes(q.toLowerCase()) ||
    o.customerName.toLowerCase().includes(q.toLowerCase()) ||
    o.phone.includes(q)
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                'h-9 rounded-full px-4 text-xs font-semibold transition-colors',
                filter === s
                  ? 'bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white shadow-premium'
                  : 'bg-white border border-[#D6E4FF] text-[#102A43] hover:bg-[#E8F1FF]'
              )}
            >
              {s === 'all' ? 'Бүгд' : ORDER_STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#5B7290]" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Хайх..." className="pl-9 border-[#D6E4FF] bg-white" />
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-[#D6E4FF] shadow-premium overflow-hidden">
        {loading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="size-7 animate-spin text-[#1677FF]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="mx-auto size-10 text-[#5B7290]/40" />
            <p className="mt-3 text-sm text-[#5B7290]">Захиалга олдсонгүй</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F5F9FF] text-[#5B7290] text-xs uppercase">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold">Захиалга</th>
                  <th className="text-left px-5 py-3 font-semibold">Худалдан авагч</th>
                  <th className="text-left px-5 py-3 font-semibold">Дүн</th>
                  <th className="text-left px-5 py-3 font-semibold">Төлөв</th>
                  <th className="text-left px-5 py-3 font-semibold">Огноо</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF4FF]">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-[#F5F9FF]/40">
                    <td className="px-5 py-3">
                      <span className="font-bold text-[#0B4DBA]">#{o.orderNumber}</span>
                      <span className="ml-2 text-xs text-[#5B7290]">{o.items.length} бүтээгдэхүүн</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-[#102A43] font-medium">{o.customerName}</div>
                      <div className="text-xs text-[#5B7290]">{o.phone}</div>
                    </td>
                    <td className="px-5 py-3 font-bold text-[#102A43]">{formatTugrik(o.totalAmount)}</td>
                    <td className="px-5 py-3">
                      <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold border whitespace-nowrap', ORDER_STATUS_COLOR[o.status])}>
                        {ORDER_STATUS_LABEL[o.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-[#5B7290] whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleString('mn-MN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => openDetail(o)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#D6E4FF] bg-white px-3 py-1.5 text-xs font-semibold text-[#102A43] hover:bg-[#E8F1FF]"
                      >
                        <Eye className="size-3.5" /> Үзэх
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-2xl p-0 bg-white border-[#D6E4FF] overflow-hidden max-h-[94vh]">
          <DialogTitle className="sr-only">Захиалгын дэлгэрэнгүй</DialogTitle>
          {selected && (
            <div className="max-h-[94vh] overflow-y-auto custom-scroll">
              <div className="px-6 py-5 border-b border-[#EEF4FF] bg-gradient-to-r from-[#E8F1FF] to-white flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#102A43]">#{selected.orderNumber}</h2>
                  <p className="text-xs text-[#5B7290]">{new Date(selected.createdAt).toLocaleString('mn-MN')}</p>
                </div>
                <span className={cn('rounded-full px-3 py-1 text-xs font-semibold border', ORDER_STATUS_COLOR[selected.status])}>
                  {ORDER_STATUS_LABEL[selected.status]}
                </span>
              </div>

              <div className="p-6 space-y-5">
                {/* customer */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-[#D6E4FF] bg-[#F5F9FF]/50 p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-[#5B7290]">Худалдан авагч</h4>
                    <p className="mt-2 text-sm font-bold text-[#102A43]">{selected.customerName}</p>
                    <div className="mt-3 space-y-1.5 text-xs">
                      <button onClick={() => copy(selected.phone, 'Утас')} className="flex items-center gap-1.5 text-[#5B7290] hover:text-[#1677FF] w-full">
                        <Phone className="size-3.5" /> {selected.phone}
                        <Copy className="size-3 ml-auto" />
                      </button>
                      <button onClick={() => copy(selected.email, 'И-мэйл')} className="flex items-center gap-1.5 text-[#5B7290] hover:text-[#1677FF] w-full">
                        <Mail className="size-3.5" /> {selected.email}
                        <Copy className="size-3 ml-auto" />
                      </button>
                      {selected.telegram && (
                        <button onClick={() => copy(selected.telegram.replace(/^@/, ''), 'Telegram')} className="flex items-center gap-1.5 text-[#5B7290] hover:text-[#1677FF] w-full">
                          <Send className="size-3.5" /> {selected.telegram}
                          <Copy className="size-3 ml-auto" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#D6E4FF] bg-[#F5F9FF]/50 p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-[#5B7290]">Төлбөр</h4>
                    <p className="mt-2 text-sm font-bold text-[#102A43]">{formatTugrik(selected.totalAmount)}</p>
                    <p className="mt-1 text-xs text-[#5B7290]">
                      Төлөв: {selected.payment?.status === 'PAID' ? 'Төлөгдсөн' : selected.payment?.status === 'PENDING' ? 'Хүлээгдэж байна' : selected.payment?.status || '—'}
                    </p>
                    {selected.payment?.invoiceNumber && (
                      <p className="mt-1 text-xs text-[#5B7290]">Нэхэмжлэл: {selected.payment.invoiceNumber}</p>
                    )}
                    {selected.payment?.paidAt && (
                      <p className="mt-1 text-xs text-[#16A34A]">Төлсөн: {new Date(selected.payment.paidAt).toLocaleString('mn-MN')}</p>
                    )}
                  </div>
                </div>

                {/* items */}
                <div className="rounded-xl border border-[#D6E4FF] divide-y divide-[#EEF4FF]">
                  <div className="px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#5B7290]">Бүтээгдэхүүн</div>
                  {selected.items.map((it) => (
                    <div key={it.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#102A43]">{it.productName}</p>
                        <p className="text-xs text-[#5B7290]">{formatTugrik(it.price)} × {it.quantity}</p>
                      </div>
                      <span className="text-sm font-bold text-[#102A43]">{formatTugrik(it.price * it.quantity)}</span>
                    </div>
                  ))}
                  <div className="px-4 py-3 flex items-center justify-between bg-[#F5F9FF]/40">
                    <span className="text-sm font-bold text-[#102A43]">Нийт</span>
                    <span className="text-lg font-extrabold text-[#102A43]">{formatTugrik(selected.totalAmount)}</span>
                  </div>
                </div>

                {/* actions */}
                <div className="flex flex-wrap gap-2">
                  {selected.status === 'PENDING_PAYMENT' && (
                    <Button
                      onClick={() => action(selected.id, 'mark_paid')}
                      disabled={actionLoading}
                      className="bg-[#16A34A] hover:bg-[#15803D] text-white gap-1.5"
                    >
                      <CheckCircle2 className="size-4" /> Төлбөр төлөгдсөнөөр тэмдэглэх
                    </Button>
                  )}
                  {(selected.status === 'PAID') && (
                    <Button
                      onClick={() => action(selected.id, 'mark_delivered')}
                      disabled={actionLoading}
                      className="bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white gap-1.5"
                    >
                      <Package className="size-4" /> Хүргэгдсэнээр тэмдэглэх
                    </Button>
                  )}
                  {selected.status !== 'CANCELLED' && selected.status !== 'DELIVERED' && (
                    <Button
                      onClick={() => action(selected.id, 'cancel')}
                      disabled={actionLoading}
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 gap-1.5"
                    >
                      <XCircle className="size-4" /> Цуцлах
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
