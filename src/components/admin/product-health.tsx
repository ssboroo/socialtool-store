'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, ClipboardCheck, RefreshCw, Search, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Issue = { productId: string; name: string; code: string; severity: 'critical' | 'warning' | 'info'; message: string; remedy: string }
type Report = { scannedAt: string; productCount: number; affectedCount: number; totals: { critical: number; warning: number; info: number }; issues: Issue[] }

export function AdminProductHealth({ onLocate }: { onLocate?: (name: string) => void }) {
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [severity, setSeverity] = useState<'all' | Issue['severity']>('all')
  const [q, setQ] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    queueMicrotask(() => { if (!controller.signal.aborted) { setLoading(true); setError('') } })
    void fetch('/api/admin/product-health', { cache: 'no-store', signal: controller.signal })
      .then(async response => { if (!response.ok) throw Error('Барааны шалгалт уншиж чадсангүй'); return response.json() as Promise<Report> })
      .then(data => { if (!controller.signal.aborted) setReport(data) })
      .catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Алдаа') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [retry])
  const rows = useMemo(() => (report?.issues || []).filter(item =>
    (severity === 'all' || item.severity === severity) && item.name.toLowerCase().includes(q.trim().toLowerCase())), [report, q, severity])
  const colors = {
    critical: 'border-red-200 bg-red-50 text-red-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    info: 'border-blue-200 bg-blue-50 text-blue-800',
  }
  const labels = { critical: 'Ноцтой', warning: 'Анхааруулга', info: 'Мэдээлэл' }
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#1677FF]"><ClipboardCheck className="size-4"/> PRODUCT HEALTH</p>
        <h2 className="mt-1 text-2xl font-extrabold text-[#102A43]">Бүтээгдэхүүний чанарын хяналт</h2>
        <p className="mt-1 text-xs text-[#5B7290]">Лого, зураг, тайлбар, үнэ болон дотоод файлыг шалгана. Гадаад сайтын холбоосыг аюулгүй байдлын үүднээс автоматаар нээдэггүй.</p></div>
      <Button disabled={loading} onClick={() => setRetry(n => n + 1)} className="gap-2"><RefreshCw className={'size-4 ' + (loading ? 'animate-spin' : '')}/> Дахин шалгах</Button>
    </div>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</p>}
    {report && <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Шалгасан бараа', count: report.productCount, color: 'text-[#0B4DBA]', Icon: ClipboardCheck },
          { title: 'Алдаатай бараа', count: report.affectedCount, color: 'text-amber-700', Icon: AlertTriangle },
          { title: 'Ноцтой алдаа', count: report.totals.critical, color: 'text-red-700', Icon: ShieldAlert },
          { title: 'Анхааруулга', count: report.totals.warning, color: 'text-[#0B4DBA]', Icon: CheckCircle2 },
        ].map(({ title, count, color, Icon }) => <div key={title} className="rounded-2xl border border-[#D6E4FF] bg-white p-5"><Icon className={'mb-3 size-6 ' + color}/><p className="text-xs text-[#5B7290]">{title}</p><strong className="text-3xl font-black tabular-nums text-[#102A43]">{count}</strong></div>)}
      </div>
      <div className="flex flex-wrap gap-2">
        {(['all','critical','warning','info'] as const).map(item => <Button key={item} size="sm" onClick={() => setSeverity(item)} variant={severity === item ? 'default' : 'outline'}>{item === 'all' ? 'Бүгд' : labels[item]}</Button>)}
        <label className="relative min-w-[180px] flex-1"><Search className="absolute left-3 top-2.5 size-4 text-[#5B7290]"/><input value={q} onChange={e => setQ(e.target.value)} placeholder="Барааны нэрээр шүүх…" className="h-9 w-full rounded-xl border border-[#D6E4FF] bg-white pl-9 text-sm"/></label>
      </div>
      <div className="overflow-hidden rounded-2xl border border-[#D6E4FF] bg-white">
        {!rows.length ? <p className="p-10 text-center text-sm text-[#5B7290]">{loading ? 'Шалгаж байна…' : 'Энэ шүүлтүүрт алдаа олдсонгүй.'}</p> :
          <div className="divide-y divide-[#EEF4FF]">{rows.slice(0, 250).map((issue, i) => <div key={issue.productId + issue.code + i} className="flex flex-wrap items-start gap-4 p-4 sm:flex-nowrap">
            <span className={'shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ' + colors[issue.severity]}>{labels[issue.severity]}</span>
            <div className="min-w-0 flex-1"><p className="font-bold text-[#102A43]">{issue.name}</p><p className="mt-1 text-sm text-[#5B7290]">{issue.message}</p><p className="mt-1 text-xs text-[#1677FF]">Шийдэх: {issue.remedy}</p></div>
            {onLocate && <Button variant="outline" size="sm" onClick={() => onLocate(issue.name)}>Засах</Button>}
          </div>)}{rows.length > 250 && <p className="p-4 text-xs text-[#5B7290]">Эхний 250 алдаа харагдаж байна. Хайлтаар бусдыг шүүнэ үү.</p>}</div>}
      </div>
      <p className="text-xs text-[#5B7290]">Сүүлийн шалгалт: {new Date(report.scannedAt).toLocaleString('mn-MN', {timeZone:'Asia/Ulaanbaatar'})}</p>
    </>}
  </div>
}
