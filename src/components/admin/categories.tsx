'use client'

import { useEffect, useState } from 'react'
import {
  AppWindow, BarChart3, Briefcase, Cloud, Code2, Facebook, Gamepad2, Headphones,
  Instagram, LayoutGrid, Loader2, Mail, Monitor, Music2, Package, Pencil, Plus,
  ShieldCheck, Sparkles, Tag, Trash2, Twitter, Video, type LucideIcon,
} from 'lucide-react'
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

interface Category {
  id: string
  name: string
  slug: string
  icon: string
  description: string | null
  order: number
}

type IconOption = { value: string; label: string; Icon: LucideIcon }

const ICON_OPTIONS: IconOption[] = [
  { value: 'Facebook', label: 'Facebook', Icon: Facebook },
  { value: 'Instagram', label: 'Instagram', Icon: Instagram },
  { value: 'Twitter', label: 'X / Twitter', Icon: Twitter },
  { value: 'Music2', label: 'TikTok / Music', Icon: Music2 },
  { value: 'Sparkles', label: 'AI', Icon: Sparkles },
  { value: 'Headphones', label: 'Хөгжим & Аудио', Icon: Headphones },
  { value: 'AppWindow', label: 'Программ & Лиценз', Icon: AppWindow },
  { value: 'ShieldCheck', label: 'VPN & Аюулгүй байдал', Icon: ShieldCheck },
  { value: 'Code2', label: 'Код & Хөгжүүлэлт', Icon: Code2 },
  { value: 'Mail', label: 'И-мэйл & Аккаунт', Icon: Mail },
  { value: 'Gamepad2', label: 'Gaming & Network', Icon: Gamepad2 },
  { value: 'Cloud', label: 'Cloud & Storage', Icon: Cloud },
  { value: 'BarChart3', label: 'Аналитик & Маркетинг', Icon: BarChart3 },
  { value: 'Briefcase', label: 'Office & Бүтээмж', Icon: Briefcase },
  { value: 'Monitor', label: 'Windows & Лиценз', Icon: Monitor },
  { value: 'Video', label: 'Видео & Дизайн', Icon: Video },
  { value: 'Package', label: 'Ерөнхий бүтээгдэхүүн', Icon: Package },
  { value: 'LayoutGrid', label: 'Ерөнхий ангилал', Icon: LayoutGrid },
]

const ICON_MAP = new Map(ICON_OPTIONS.map(option => [option.value, option]))

function iconFor(value: string) {
  return ICON_MAP.get(value)?.Icon || Package
}

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
          items.map((c) => {
            const CategoryIcon = iconFor(c.icon)
            return (
              <div key={c.id} className="rounded-2xl bg-white border border-[#D6E4FF] shadow-premium p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#E8F1FF] to-white text-[#0B4DBA] ring-1 ring-[#D6E4FF]">
                      <CategoryIcon className="size-5" />
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
                <p className="mt-2 text-[10px] text-[#5B7290]">Дүрс: {ICON_MAP.get(c.icon)?.label || c.icon} · Дараалал: {c.order}</p>
              </div>
            )
          })
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

  const PreviewIcon = iconFor(form.icon)

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
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 border-[#D6E4FF]" placeholder="Facebook хэрэгсэл" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#102A43]">Slug (опц — хоосон үлдвэл автоматаар)</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="mt-1 border-[#D6E4FF]" placeholder="facebook" />
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
              <div>
                <Label className="text-xs font-semibold text-[#102A43]">Дүрс</Label>
                <Select value={form.icon} onValueChange={(v) => setForm({ ...form, icon: v })}>
                  <SelectTrigger className="mt-1 border-[#D6E4FF]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map(({ value, label, Icon }) => (
                      <SelectItem key={value} value={value}>
                        <span className="flex items-center gap-2"><Icon className="size-4 text-[#0B4DBA]" />{label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#1677FF] to-[#0B4DBA] text-white shadow-sm">
                <PreviewIcon className="size-5" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#102A43]">Дараалал</Label>
              <Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} className="mt-1 border-[#D6E4FF]" />
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
