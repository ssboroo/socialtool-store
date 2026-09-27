'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChartNoAxesCombined, TrendingUp, ShoppingCart, Search, Heart, Eye, CreditCard, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatTugrik } from '@/lib/format'

type Entry = { productId: string; name: string; count: number }
type Report = {
  periodDays: number; truncated: boolean
  metrics: {
    revenue: number; paidOrders: number; averageOrderValue: number; productViews: number
    cartAdds: number; checkoutStarts: number; uniqueSessions: number; currentWishlists: number
  }
  daily: { date: string; revenue: number; paidOrders: number; views: number; carts: number; checkouts: number }[]
  topViewed: Entry[]; topCarted: Entry[]; topSold: (Entry & { revenue: number })[]
  topWished: Entry[]; topSearches: { query: string; count: number }[]
}

function RankList({ title, rows }: { title: string; rows: { name: string; count: number }[] }) {
  const largest = Math.max(1, ...rows.map(row => row.count))
  return <section className="rounded-3xl border border-[#D6E4FF] bg-white p-5 shadow-sm">
    <h3 className="mb-4 font-bold text-[#102A43]">{title}</h3>
    {!rows.length ? <p className="py-7 text-sm text-[#5B7290]">Энэ хугацаанд өгөгдөл алга.</p> : <div className="space-y-3">
      {rows.map((row, index) => <div key={row.name + index} className="space-y-1.5">
        <div className="flex items-center justify-between gap-2 text-xs"><span className="line-clamp-2 min-w-0 text-[#102A43]">{row.name}</span><strong className="shrink-0 tabular-nums text-[#0B4DBA]">{row.count}</strong></div>
        <div className="h-1.5 rounded-full bg-[#EEF4FF]"><div className="h-full rounded-full bg-gradient-to-r from-[#1677FF] to-[#8B5CF6]" style={{ width: (row.count / largest * 100) + '%' }}/></div>
      </div>)}
    </div>}
  </section>
}

export function AdminAnalytics() {
  const [days, setDays] = useState<7 | 30 | 90>(30)
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    queueMicrotask(() => { if (!controller.signal.aborted) { setLoading(true); setError('') } })
    void fetch('/api/admin/analytics?days=' + days, { signal: controller.signal, cache: 'no-store' })
      .then(async res => { if (!res.ok) throw Error('Аналитикийг уншиж чадсангүй'); return res.json() as Promise<Report> })
      .then(data => { if (!controller.signal.aborted) setReport(data) })
      .catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Алдаа') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [days, retry])

  const chart = useMemo(() => {
    if (!report) return []
    const chunk = Math.ceil(report.daily.length / 14)
    return Array.from({ length: Math.ceil(report.daily.length / chunk) }, (_, i) => {
      const rows = report.daily.slice(i * chunk, (i + 1) * chunk)
      return { date: rows[0]?.date || '', revenue: rows.reduce((sum, row) => sum + row.revenue, 0) }
    })
  }, [report])
  const maxRevenue = Math.max(1, ...chart.map(row => row.revenue))
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1677FF]"><ChartNoAxesCombined className="size-4"/> БОРЛУУЛАЛТЫН АНАЛИТИК</div><h2 className="mt-1 text-2xl font-bold text-[#102A43]">Дэлгүүрийн үзүүлэлтүүд</h2><p className="mt-1 text-xs text-[#5B7290]">Үзэлт, хайлт нь зөвшөөрсөн браузеруудын ойролцоо хэмжилт. Орлого нь серверээр баталгаажсан төлбөр.</p></div>
      <div className="flex gap-2">
        {([7, 30, 90] as const).map(d => <Button key={d} size="sm" variant={days === d ? 'default' : 'outline'} onClick={() => setDays(d)}>{d} хоног</Button>)}
        <Button size="icon" variant="outline" aria-label="Шинэчлэх" onClick={() => setRetry(value => value + 1)}><RefreshCw className="size-4" /></Button>
      </div>
    </div>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {loading && !report ? <div className="rounded-2xl bg-white p-10 text-center text-[#5B7290]">Мэдээлэл ачаалж байна…</div> : report && <>
      {report.truncated && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">Энэ хугацааны үйл явдал 30,000-аас их тул үзэлт ба хайлтын статистик хэсэгчилсэн байна.</p>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: 'Баталгаажсан орлого', value: formatTugrik(report.metrics.revenue), Icon: TrendingUp },
          { title: 'Төлөгдсөн захиалга', value: report.metrics.paidOrders.toLocaleString(), Icon: CreditCard },
          { title: 'Дундаж захиалга', value: formatTugrik(report.metrics.averageOrderValue), Icon: ShoppingCart },
          { title: 'Бүтээгдэхүүний үзэлт', value: report.metrics.productViews.toLocaleString(), Icon: Eye },
          { title: 'Сагсанд нэмсэн', value: report.metrics.cartAdds.toLocaleString(), Icon: ShoppingCart },
          { title: 'Checkout эхэлсэн', value: report.metrics.checkoutStarts.toLocaleString(), Icon: CreditCard },
          { title: 'Хэмжигдсэн session', value: report.metrics.uniqueSessions.toLocaleString(), Icon: Search },
          { title: 'Одоо хадгалсан бараа', value: report.metrics.currentWishlists.toLocaleString(), Icon: Heart },
        ].map(({ title, value, Icon }) => <div key={title} className="rounded-2xl border border-[#D6E4FF] bg-white p-5 shadow-sm"><div className="mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-[#E8F1FF] text-[#1677FF]"><Icon className="size-5" /></div><p className="text-xs text-[#5B7290]">{title}</p><p className="mt-1 text-xl font-extrabold tabular-nums text-[#102A43]">{value}</p></div>)}
      </div>
      <section className="rounded-3xl border border-[#D6E4FF] bg-white p-5">
        <h3 className="mb-4 font-bold text-[#102A43]">Өдрийн төлбөрийн орлого</h3>
        <div className="flex h-40 items-end gap-2" role="img" aria-label="Сүүлийн өдрүүдийн төлбөрийн орлогын график">
          {chart.map(row => <div key={row.date} className="group flex min-w-0 flex-1 flex-col items-center gap-2" title={row.date + ': ' + formatTugrik(row.revenue)}><div className="w-full rounded-t-md bg-gradient-to-t from-[#1677FF] to-[#8B5CF6] transition-opacity group-hover:opacity-75" style={{ height: Math.max(2, Math.round(row.revenue / maxRevenue * 125)) + 'px' }}/><span className="hidden text-[10px] text-[#5B7290] sm:block">{row.date.slice(5)}</span></div>)}
        </div>
      </section>
      <div className="grid gap-4 xl:grid-cols-2">
        <RankList title="Хамгийн их үзсэн" rows={report.topViewed} />
        <RankList title="Хамгийн их сагсанд нэмсэн" rows={report.topCarted} />
        <RankList title="Хамгийн их зарагдсан" rows={report.topSold} />
        <RankList title="Хүслийн жагсаалтад хадгалсан" rows={report.topWished} />
        <RankList title="Түгээмэл хайлтууд" rows={report.topSearches.map(row => ({ name: row.query, count: row.count }))} />
      </div>
    </>}
  </div>
}
