'use client'

import { useEffect, useState } from 'react'
import { Loader2, Plus, Pencil, Trash2, Gift, Timer, Tag, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Promotion {
  id: string
  title: string
  description: string
  badgeText: string
  discountPercent: number
  active: boolean
  startAt: string
  endAt: string
}

function toLocalInput(d: string | Date) {
  const date = typeof d === 'string' ? new Date(d) : d
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

export function AdminPromotions({ token }: { token: string }) {
  const [items, setItems] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Promotion | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/promotions', { headers: { authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [token])

  const save = async (data: Record<string, unknown>) => {
    setSaving(true)
    try {
      const isEdit = !!editing
      const url = isEdit ? `/api/admin/promotions/${editing!.id}` : '/api/admin/promotions'
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      toast.success(isEdit ? 'Шинэчлэгдлээ' : 'Хямдрал зарлагдлаа')
      setEditing(null); setCreating(false); load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Алдаа')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Энэ хямдрыг устгах уу?')) return
    try {
      const res = await fetch(`/api/admin/promotions/${id}`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Алдаа')
      toast.success('Устгагдлаа')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Алдаа')
    }
  }

  const toggleActive = async (p: Promotion) => {
    try {
      const res = await fetch(`/api/admin/promotions/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ active: !p.active }),
      })
      if (!res.ok) throw new Error('Алдаа')
      toast.success(p.active ? 'Идэвхгүй болголоо' : 'Идэвхжүүллээ')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Алдаа')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#5B7290]">{items.length} хямдрал</p>
        <Button onClick={() => setCreating(true)} className="rounded-full bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white gap-1.5">
          <Plus className="size-4" /> Хямдрал зарлах
        </Button>
      </div>

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="size-7 animate-spin text-[#1677FF]" /></div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center">
          <Gift className="mx-auto size-10 text-[#5B7290]/40" />
          <p className="mt-3 text-sm text-[#5B7290]">Хямдрал байхгүй</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((p) => {
            const now = new Date()
            const isLive = p.active && new Date(p.startAt) <= now && new Date(p.endAt) >= now
            return (
              <div key={p.id} className={cn('rounded-2xl border shadow-premium overflow-hidden', isLive ? 'border-[#1677FF]/40 bg-gradient-to-br from-[#E8F1FF] to-white' : 'border-[#D6E4FF] bg-white')}>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#1677FF] to-[#0B4DBA] text-white font-bold">
                        {p.discountPercent}%
                      </span>
                      <div>
                        <p className="text-sm font-bold text-[#102A43]">{p.title}</p>
                        <span className={cn('inline-flex items-center gap-1 mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                          isLive ? 'bg-[#E6F7EB] text-[#16A34A]' : p.active ? 'bg-[#FFF5E6] text-[#F59E0B]' : 'bg-gray-100 text-gray-500')}>
                          {isLive ? 'Идэвхтэй' : p.active ? 'Хүлээгдэж байна' : 'Идэвхгүй'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => toggleActive(p)} className="grid size-8 place-items-center rounded-lg text-[#5B7290] hover:bg-[#E8F1FF] hover:text-[#1677FF]" title={p.active ? 'Идэвхгүй болгох' : 'Идэвхжүүлэх'}>
                        {p.active ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
                      </button>
                      <button onClick={() => setEditing(p)} className="grid size-8 place-items-center rounded-lg text-[#5B7290] hover:bg-[#E8F1FF] hover:text-[#1677FF]">
                        <Pencil className="size-4" />
                      </button>
                      <button onClick={() => remove(p.id)} className="grid size-8 place-items-center rounded-lg text-[#5B7290] hover:bg-red-50 hover:text-red-500">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-[#5B7290] line-clamp-2">{p.description}</p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-[#5B7290]">
                    <span className="inline-flex items-center gap-1"><Tag className="size-3" /> {p.badgeText}</span>
                    <span className="inline-flex items-center gap-1"><Timer className="size-3" /> {new Date(p.startAt).toLocaleDateString('mn-MN')} → {new Date(p.endAt).toLocaleDateString('mn-MN')}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <PromoFormDialog open={creating || !!editing} promo={editing} saving={saving} onClose={() => { setEditing(null); setCreating(false) }} onSave={save} />
    </div>
  )
}

function PromoFormDialog({
  open, promo, saving, onClose, onSave,
}: {
  open: boolean
  promo: Promotion | null
  saving: boolean
  onClose: () => void
  onSave: (data: Record<string, unknown>) => void
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    badgeText: 'Хямдрал',
    discountPercent: '20',
    active: true,
    startAt: '',
    endAt: '',
  })

  useEffect(() => {
    if (promo) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        title: promo.title,
        description: promo.description,
        badgeText: promo.badgeText,
        discountPercent: String(promo.discountPercent),
        active: promo.active,
        startAt: toLocalInput(promo.startAt),
        endAt: toLocalInput(promo.endAt),
      })
    } else if (open) {
      const now = new Date()
      const end = new Date(); end.setDate(end.getDate() + 3); end.setHours(23, 59, 0, 0)
       
      setForm({
        title: '',
        description: '',
        badgeText: 'Хямдрал',
        discountPercent: '20',
        active: true,
        startAt: toLocalInput(now),
        endAt: toLocalInput(end),
      })
    }
  }, [promo, open])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Гарчиг шаардлагатай'); return }
    if (!form.endAt) { toast.error('Дуусах хугацаа шаардлагатай'); return }
    onSave({
      title: form.title.trim(),
      description: form.description.trim(),
      badgeText: form.badgeText.trim(),
      discountPercent: Number(form.discountPercent) || 0,
      active: form.active,
      startAt: new Date(form.startAt || new Date()).toISOString(),
      endAt: new Date(form.endAt).toISOString(),
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 bg-white border-[#D6E4FF] overflow-hidden max-h-[94vh]">
        <DialogTitle className="sr-only">{promo ? 'Хямдрал засах' : 'Шинэ хямдрал зарлах'}</DialogTitle>
        <form onSubmit={submit}>
          <div className="px-6 py-4 border-b border-[#EEF4FF] bg-gradient-to-r from-[#E8F1FF] to-white">
            <h2 className="text-base font-bold text-[#102A43]">{promo ? 'Хямдрал засах' : 'Шинэ хямдрал зарлах'}</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <Label className="text-xs font-semibold text-[#102A43]">Гарчиг *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 border-[#D6E4FF]" placeholder="Шинэ хэрэглэгчдэд зориулсан онцгой хямдрал" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#102A43]">Тайлбар</Label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="mt-1 w-full rounded-md border border-[#D6E4FF] bg-white px-3 py-2 text-sm text-[#102A43] focus:border-[#1677FF] focus:outline-none custom-scroll" placeholder="Анхны захиалгаа хийгчдэд..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-[#102A43]">Бэдж текст</Label>
                <Input value={form.badgeText} onChange={(e) => setForm({ ...form, badgeText: e.target.value })} className="mt-1 border-[#D6E4FF]" placeholder="Шинэ хэрэглэгчдэд" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-[#102A43]">Хямдрал (%)</Label>
                <Input type="number" min={0} max={90} value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} className="mt-1 border-[#D6E4FF]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-[#102A43]">Эхлэх хугацаа</Label>
                <Input type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} className="mt-1 border-[#D6E4FF]" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-[#102A43]">Дуусах хугацаа *</Label>
                <Input type="datetime-local" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} className="mt-1 border-[#D6E4FF]" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-[#102A43] cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="size-4 rounded border-[#D6E4FF] accent-[#1677FF]" />
              Идэвхтэй (нүүр хуудсанд харагдана)
            </label>
          </div>
          <div className="px-6 py-4 border-t border-[#EEF4FF] flex gap-2 bg-[#F5F9FF]/50">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-[#D6E4FF]">Цуцлах</Button>
            <Button type="submit" disabled={saving} className="flex-1 bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white">
              {saving ? <Loader2 className="size-4 animate-spin" /> : null} Хадгалах
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
