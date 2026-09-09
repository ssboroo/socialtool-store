'use client'

import { useEffect, useState } from 'react'
import { Loader2, Plus, Pencil, Trash2, Search, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Category {
  id: string
  name: string
  slug: string
  icon: string
  description: string | null
  order: number
}

const ICONS = ['Facebook', 'Music2', 'Instagram', 'Twitter', 'Send', 'Mail', 'Sparkles', 'LayoutGrid', 'Package']

export function AdminCategories({ token }: { token: string }) {
  const [items, setItems] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Category | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/categories', { headers: { authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [token])

  const save = async (data: Partial<Category> & { name: string }) => {
    setSaving(true)
    try {
      const isEdit = !!editing
      const url = isEdit ? `/api/admin/categories/${editing!.id}` : '/api/admin/categories'
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      toast.success(isEdit ? 'Шинэчлэгдлээ' : 'Үүсгэгдлээ')
      setEditing(null)
      setCreating(false)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Алдаа')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Энэ ангиллыг устгах уу? Бүтээгдэхүүнтэй бол устгах боломжгүй.')) return
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Устгагдлаа')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Алдаа')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#5B7290]">{items.length} ангилал</p>
        <Button onClick={() => setCreating(true)} className="rounded-full bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white gap-1.5">
          <Plus className="size-4" /> Шинэ ангилал
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full grid place-items-center py-20"><Loader2 className="size-7 animate-spin text-[#1677FF]" /></div>
        ) : items.length === 0 ? (
          <div className="col-span-full py-16 text-center">
            <Tag className="mx-auto size-10 text-[#5B7290]/40" />
            <p className="mt-3 text-sm text-[#5B7290]">Ангилал байхгүй</p>
          </div>
        ) : (
          items.map((c) => (
            <div key={c.id} className="rounded-2xl bg-white border border-[#D6E4FF] shadow-premium p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid size-9 place-items-center rounded-xl bg-[#E8F1FF] text-[#0B4DBA] text-xs font-bold">
                    {c.icon.slice(0, 2)}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#102A43]">{c.name}</p>
                    <p className="text-xs text-[#5B7290]">/{c.slug}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(c)} className="grid size-8 place-items-center rounded-lg text-[#5B7290] hover:bg-[#E8F1FF] hover:text-[#1677FF]">
                    <Pencil className="size-4" />
                  </button>
                  <button onClick={() => remove(c.id)} className="grid size-8 place-items-center rounded-lg text-[#5B7290] hover:bg-red-50 hover:text-red-500">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-xs text-[#5B7290] line-clamp-2 min-h-[32px]">{c.description || 'Тайлбар байхгүй'}</p>
              <p className="mt-2 text-[10px] text-[#5B7290]">Дараалал: {c.order}</p>
            </div>
          ))
        )}
      </div>

      <CategoryFormDialog open={creating || !!editing} category={editing} saving={saving} onClose={() => { setEditing(null); setCreating(false) }} onSave={save} />
    </div>
  )
}

function CategoryFormDialog({
  open, category, saving, onClose, onSave,
}: {
  open: boolean
  category: Category | null
  saving: boolean
  onClose: () => void
  onSave: (data: Partial<Category> & { name: string }) => void
}) {
  const [form, setForm] = useState({ name: '', slug: '', icon: 'Package', description: '', order: '0' })

  useEffect(() => {
    if (category) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({ name: category.name, slug: category.slug, icon: category.icon, description: category.description || '', order: String(category.order) })
    } else if (open) {
       
      setForm({ name: '', slug: '', icon: 'Package', description: '', order: '0' })
    }
  }, [category, open])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Нэр шаардлагатай'); return }
    onSave({
      name: form.name.trim(),
      slug: form.slug.trim(),
      icon: form.icon,
      description: form.description.trim(),
      order: Number(form.order) || 0,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md p-0 bg-white border-[#D6E4FF] overflow-hidden max-h-[94vh]">
        <DialogTitle className="sr-only">{category ? 'Ангилал засах' : 'Шинэ ангилал'}</DialogTitle>
        <form onSubmit={submit}>
          <div className="px-6 py-4 border-b border-[#EEF4FF] bg-gradient-to-r from-[#E8F1FF] to-white">
            <h2 className="text-base font-bold text-[#102A43]">{category ? 'Ангилал засах' : 'Шинэ ангилал'}</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <Label className="text-xs font-semibold text-[#102A43]">Нэр *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 border-[#D6E4FF]" placeholder="Facebook Tool" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#102A43]">Slug (опц — хоосон үлдвэл автоматаар)</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="mt-1 border-[#D6E4FF]" placeholder="facebook" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-[#102A43]">Дүрс</Label>
                <Select value={form.icon} onValueChange={(v) => setForm({ ...form, icon: v })}>
                  <SelectTrigger className="mt-1 border-[#D6E4FF]"><SelectValue /></SelectTrigger>
                  <SelectContent>{ICONS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-[#102A43]">Дараалал</Label>
                <Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} className="mt-1 border-[#D6E4FF]" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#102A43]">Тайлбар</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 border-[#D6E4FF]" placeholder="Facebook хуудас, бүлэг, аккаунт удирдлага" />
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
