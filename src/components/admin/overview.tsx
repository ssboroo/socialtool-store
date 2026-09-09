'use client'

import { useEffect, useState } from 'react'
import {
  TrendingUp, ShoppingBag, Clock, CheckCircle2, Package, ArrowUpRight, Users, Gift,
} from 'lucide-react'
import { formatTugrik, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '@/lib/format'
import { cn } from '@/lib/utils'

interface Stats {
  todayOrders: number
  todayRevenue: number
  totalRevenue: number
  pendingOrders: number
  paidOrders: number
  totalProducts: number
  totalCustomers: number
  activePromotions: number
  recentOrders: {
    id: string
    orderNumber: string
    customerName: string
    totalAmount: number
    status: string
    createdAt: string
    itemCount: number
  }[]
}

export function AdminOverview({ token }: { token: string }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats', { headers: { authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return <div className="grid place-items-center py-24 text-[#5B7290]">Ачаалж байна...</div>
  }
  if (!stats) return <div className="py-24 text-center text-[#5B7290]">Мэдээлэл олдсонгүй</div>

  const cards = [
    { label: 'Өнөөдрийн захиалга', value: String(stats.todayOrders), Icon: ShoppingBag, color: 'from-[#1677FF] to-[#0B4DBA]', bg: 'bg-[#E8F1FF]' },
    { label: 'Өнөөдрийн орлого', value: formatTugrik(stats.todayRevenue), Icon: TrendingUp, color: 'from-[#16A34A] to-[#0B4DBA]', bg: 'bg-[#E6F7EB]' },
    { label: 'Хүлээгдэж буй', value: String(stats.pendingOrders), Icon: Clock, color: 'from-[#F59E0B] to-[#DC2626]', bg: 'bg-[#FFF5E6]' },
    { label: 'Төлөгдсөн захиалга', value: String(stats.paidOrders), Icon: CheckCircle2, color: 'from-[#16A34A] to-[#1677FF]', bg: 'bg-[#E6F7EB]' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const { Icon } = c
          return (
            <div key={c.label} className="relative overflow-hidden rounded-2xl bg-white border border-[#D6E4FF] p-5 shadow-premium">
              <div className={cn('absolute -right-6 -top-6 size-20 rounded-full opacity-50', c.bg)} />
              <div className="relative">
                <div className={cn('grid size-10 place-items-center rounded-xl bg-gradient-to-br shadow-premium', c.color)}>
                  <Icon className="size-5 text-white" />
                </div>
                <p className="mt-3 text-xs font-medium text-[#5B7290]">{c.label}</p>
                <p className="mt-1 text-2xl font-extrabold text-[#102A43]">{c.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-white border border-[#D6E4FF] shadow-premium overflow-hidden">
          <div className="px-5 py-4 border-b border-[#EEF4FF] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#102A43]">Сүүлийн захиалгууд</h3>
            <Package className="size-4 text-[#5B7290]" />
          </div>
          <div className="divide-y divide-[#EEF4FF]">
            {stats.recentOrders.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-[#5B7290]">Захиалга алга</div>
            ) : (
              stats.recentOrders.map((o) => (
                <div key={o.id} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-[#F5F9FF]/60">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#0B4DBA]">#{o.orderNumber}</span>
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold border', ORDER_STATUS_COLOR[o.status])}>
                        {ORDER_STATUS_LABEL[o.status]}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[#5B7290] truncate">
                      {o.customerName} · {o.itemCount} бүтээгдэхүүн · {new Date(o.createdAt).toLocaleString('mn-MN')}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-[#102A43] whitespace-nowrap">{formatTugrik(o.totalAmount)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-[#1677FF] to-[#0B4DBA] p-6 text-white shadow-premium-lg">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="size-5" />
            <span className="text-sm font-semibold">Нийт орлого</span>
          </div>
          <p className="mt-3 text-4xl font-extrabold">{formatTugrik(stats.totalRevenue)}</p>
          <p className="mt-1 text-xs text-white/70">{stats.paidOrders} төлөгдсөн захиалгаас</p>
          <div className="mt-6 rounded-xl bg-white/15 backdrop-blur p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/80 flex items-center gap-1.5"><Package className="size-3.5" /> Бүтээгдэхүүн</span>
              <span className="font-bold">{stats.totalProducts}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/80 flex items-center gap-1.5"><Users className="size-3.5" /> Хэрэглэгч</span>
              <span className="font-bold">{stats.totalCustomers}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/80 flex items-center gap-1.5"><Gift className="size-3.5" /> Идэвхтэй хямдрал</span>
              <span className="font-bold">{stats.activePromotions}</span>
            </div>
            <div className="flex items-center justify-between text-sm border-t border-white/15 pt-3">
              <span className="text-white/80">Төлөгдөөгүй</span>
              <span className="font-bold">{stats.pendingOrders}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
