'use client'

import { useEffect, useState } from 'react'
import { Loader2, Plus, Pencil, Trash2, HelpCircle, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface Faq {
  id: string
  question: string
  answer: string
  order: number
}

export function AdminFaqs({ token }: { token: string }) {
  const [items, setItems] = useState<Faq[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Faq | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/faqs', { headers: { authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [token])

  const save = async (data: { question: string; answer: string; order: number }) => {
    setSaving(true)
    try {
      const isEdit = !!editing
      const url = isEdit ? `/api/admin/faqs/${editing!.id}` : '/api/admin/faqs'
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
    if (!confirm('Энэ асуултыг устгах уу?')) return
    try {
      const res = await fetch(`/api/admin/faqs/${id}`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } })
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
        <p className="text-sm text-[#5B7290]">{items.length} асуулт</p>
        <Button onClick={() => setCreating(true)} className="rounded-full bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white gap-1.5">
          <Plus className="size-4" /> Шинэ асуулт
        </Button>
      </div>

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="size-7 animate-spin text-[#1677FF]" /></div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center">
          <HelpCircle className="mx-auto size-10 text-[#5B7290]/40" />
          <p className="mt-3 text-sm text-[#5B7290]">Асуулт байхгүй</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((f) => (
            <div key={f.id} className="rounded-2xl bg-white border border-[#D6E4FF] shadow-premium p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <GripVertical className="size-4 text-[#5B7290]/40 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#102A43]">{f.question}</p>
                    <p className="mt-1 text-sm text-[#5B7290] line-clamp-2">{f.answer}</p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setEditing(f)} className="grid size-8 place-items-center rounded-lg text-[#5B7290] hover:bg-[#E8F1FF] hover:text-[#1677FF]">
                    <Pencil className="size-4" />
                  </button>
                  <button onClick={() => remove(f.id)} className="grid size-8 place-items-center rounded-lg text-[#5B7290] hover:bg-red-50 hover:text-red-500">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <FaqFormDialog open={creating || !!editing} faq={editing} saving={saving} onClose={() => { setEditing(null); setCreating(false) }} onSave={save} />
    </div>
  )
}

function FaqFormDialog({
  open, faq, saving, onClose, onSave,
}: {
  open: boolean
  faq: Faq | null
  saving: boolean
  onClose: () => void
  onSave: (data: { question: string; answer: string; order: number }) => void
}) {
  const [form, setForm] = useState({ question: '', answer: '', order: '0' })

  useEffect(() => {
    if (faq) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({ question: faq.question, answer: faq.answer, order: String(faq.order) })
    } else if (open) {
       
      setForm({ question: '', answer: '', order: '0' })
    }
  }, [faq, open])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.question.trim() || !form.answer.trim()) { toast.error('Асуулт болон хариулт шаардлагатай'); return }
    onSave({ question: form.question.trim(), answer: form.answer.trim(), order: Number(form.order) || 0 })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 bg-white border-[#D6E4FF] overflow-hidden max-h-[94vh]">
        <DialogTitle className="sr-only">{faq ? 'Асуулт засах' : 'Шинэ асуулт'}</DialogTitle>
        <form onSubmit={submit}>
          <div className="px-6 py-4 border-b border-[#EEF4FF] bg-gradient-to-r from-[#E8F1FF] to-white">
            <h2 className="text-base font-bold text-[#102A43]">{faq ? 'Асуулт засах' : 'Шинэ асуулт'}</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <Label className="text-xs font-semibold text-[#102A43]">Асуулт *</Label>
              <Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className="mt-1 border-[#D6E4FF]" placeholder="Худалдан авалт хийсний дараа хэр хурдан ирэх вэ?" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#102A43]">Хариулт *</Label>
              <textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} rows={5} className="mt-1 w-full rounded-md border border-[#D6E4FF] bg-white px-3 py-2 text-sm text-[#102A43] focus:border-[#1677FF] focus:outline-none custom-scroll" placeholder="Төлбөрөө баталгаажуулсны дараа..." />
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#102A43]">Дараалал</Label>
              <Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} className="mt-1 border-[#D6E4FF] w-32" />
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
