'use client'

import { useEffect, useState } from 'react'
import { Loader2, Plus, Pencil, Trash2, Star, Quote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface Review {
  id: string
  name: string
  role: string
  rating: number
  content: string
}

export function AdminReviews({ token }: { token: string }) {
  const [items, setItems] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Review | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/reviews', { headers: { authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [token])

  const save = async (data: Partial<Review> & { name: string; content: string }) => {
    setSaving(true)
    try {
      const isEdit = !!editing
      const url = isEdit ? `/api/admin/reviews/${editing!.id}` : '/api/admin/reviews'
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      toast.success(isEdit ? 'Шинэчлэгдлээ' : 'Үүсгэгдлээ')
      setEditing(null); setCreating(false); load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Алдаа')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Энэ сэтгэгдлийг устгах уу?')) return
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Алдаа')
      toast.success('Устгагдлаа')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Алдаа')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#5B7290]">{items.length} сэтгэгдэл</p>
        <Button onClick={() => setCreating(true)} className="rounded-full bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white gap-1.5">
          <Plus className="size-4" /> Шинэ сэтгэгдэл
        </Button>
      </div>

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="size-7 animate-spin text-[#1677FF]" /></div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center">
          <Quote className="mx-auto size-10 text-[#5B7290]/40" />
          <p className="mt-3 text-sm text-[#5B7290]">Сэтгэгдэл байхгүй</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((r) => (
            <div key={r.id} className="rounded-2xl bg-white border border-[#D6E4FF] shadow-premium p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`size-3.5 ${i < r.rating ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-[#D6E4FF] fill-[#D6E4FF]'}`} />
                    ))}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(r)} className="grid size-8 place-items-center rounded-lg text-[#5B7290] hover:bg-[#E8F1FF] hover:text-[#1677FF]">
                    <Pencil className="size-4" />
                  </button>
                  <button onClick={() => remove(r.id)} className="grid size-8 place-items-center rounded-lg text-[#5B7290] hover:bg-red-50 hover:text-red-500">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm text-[#5B7290] italic line-clamp-3">“{r.content}”</p>
              <div className="mt-3 pt-3 border-t border-[#EEF4FF]">
                <p className="text-sm font-bold text-[#102A43]">{r.name}</p>
                <p className="text-xs text-[#5B7290]">{r.role}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <ReviewFormDialog open={creating || !!editing} review={editing} saving={saving} onClose={() => { setEditing(null); setCreating(false) }} onSave={save} />
    </div>
  )
}

function ReviewFormDialog({
  open, review, saving, onClose, onSave,
}: {
  open: boolean
  review: Review | null
  saving: boolean
  onClose: () => void
  onSave: (data: Partial<Review> & { name: string; content: string }) => void
}) {
  const [form, setForm] = useState({ name: '', role: '', rating: '5', content: '' })

  useEffect(() => {
    if (review) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({ name: review.name, role: review.role, rating: String(review.rating), content: review.content })
    } else if (open) {
       
      setForm({ name: '', role: '', rating: '5', content: '' })
    }
  }, [review, open])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.content.trim()) { toast.error('Нэр болон агуулга шаардлагатай'); return }
    onSave({ name: form.name.trim(), role: form.role.trim() || 'Хэрэглэгч', rating: Number(form.rating), content: form.content.trim() })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md p-0 bg-white border-[#D6E4FF] overflow-hidden max-h-[94vh]">
        <DialogTitle className="sr-only">{review ? 'Сэтгэгдэл засах' : 'Шинэ сэтгэгдэл'}</DialogTitle>
        <form onSubmit={submit}>
          <div className="px-6 py-4 border-b border-[#EEF4FF] bg-gradient-to-r from-[#E8F1FF] to-white">
            <h2 className="text-base font-bold text-[#102A43]">{review ? 'Сэтгэгдэл засах' : 'Шинэ сэтгэгдэл'}</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-[#102A43]">Нэр *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 border-[#D6E4FF]" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-[#102A43]">Албан тушаал</Label>
                <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="mt-1 border-[#D6E4FF]" placeholder="SMM менежер" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#102A43]">Үнэлгээ</Label>
              <div className="mt-1 flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setForm({ ...form, rating: String(n) })} className="p-1">
                    <Star className={`size-6 ${n <= Number(form.rating) ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-[#D6E4FF] fill-[#D6E4FF]'}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#102A43]">Агуулга *</Label>
              <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} className="mt-1 w-full rounded-md border border-[#D6E4FF] bg-white px-3 py-2 text-sm text-[#102A43] focus:border-[#1677FF] focus:outline-none custom-scroll" placeholder="Хэрэглэгчийн сэтгэгдэл..." />
            </div>
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
