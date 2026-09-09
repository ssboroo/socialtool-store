'use client'

import { useEffect, useState } from 'react'
import { Loader2, Plus, Pencil, Trash2, Star, Search, Package, X, Clock, Upload, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { formatTugrik } from '@/lib/format'
import { ProductImage, ProductIllustration } from '@/components/site/product-illustration'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Category {
  id: string
  name: string
  slug: string
  icon: string
}
interface Product {
  id: string
  name: string
  slug: string
  shortDesc: string
  description: string
  price: number
  oldPrice: number | null
  discount: number | null
  icon: string
  image: string | null
  category: string
  categoryId: string
  rating: number
  reviewCount: number
  available: boolean
  featured: boolean
  features: string | null
  duration: string | null
  tutorialVideoUrl: string | null
  instructionImages: string | null
}

const ICONS = ['Facebook', 'Music2', 'Instagram', 'Twitter', 'Send', 'Mail', 'Sparkles', 'LayoutGrid', 'Package']

export function AdminProducts({ token, categories }: { token: string; categories: Category[] }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<Product | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    fetch(`/api/admin/products?q=${encodeURIComponent(q)}`, { headers: { authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setProducts(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
     
  }, [q, token])

  const save = async (data: Partial<Product> & { name: string; price: number; category: string; categoryId: string }) => {
    setSaving(true)
    try {
      const isEdit = !!editing
      const url = isEdit ? `/api/admin/products/${editing!.id}` : '/api/admin/products'
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
    if (!confirm('Энэ бүтээгдэхүүнийг устгах уу?')) return
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Алдаа')
      toast.success('Устгагдлаа')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Алдаа')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#5B7290]" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Хайх..." className="pl-9 border-[#D6E4FF] bg-white" />
        </div>
        <Button onClick={() => setCreating(true)} className="rounded-full bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white gap-1.5">
          <Plus className="size-4" /> Шинэ бүтээгдэхүүн
        </Button>
      </div>

      <div className="rounded-2xl bg-white border border-[#D6E4FF] shadow-premium overflow-hidden">
        {loading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="size-7 animate-spin text-[#1677FF]" />
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="mx-auto size-10 text-[#5B7290]/40" />
            <p className="mt-3 text-sm text-[#5B7290]">Бүтээгдэхүүн олдсонгүй</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F5F9FF] text-[#5B7290] text-xs uppercase">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold">Нэр</th>
                  <th className="text-left px-5 py-3 font-semibold">Ангилал</th>
                  <th className="text-left px-5 py-3 font-semibold">Үнэ</th>
                  <th className="text-left px-5 py-3 font-semibold">Үнэлгээ</th>
                  <th className="text-left px-5 py-3 font-semibold">Төлөв</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF4FF]">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F5F9FF]/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <ProductImage image={p.image} icon={p.icon} alt={p.name} className="size-11 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-[#102A43] truncate">{p.name}</p>
                          <p className="text-xs text-[#5B7290] truncate max-w-xs">{p.shortDesc}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[#5B7290] whitespace-nowrap">{p.category}</td>
                    <td className="px-5 py-3">
                      <span className="font-bold text-[#102A43]">{formatTugrik(p.price)}</span>
                      {p.oldPrice && (
                        <span className="ml-1.5 text-xs text-[#5B7290] line-through">{formatTugrik(p.oldPrice)}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="size-3.5 text-[#F59E0B] fill-[#F59E0B]" />
                        <span className="text-[#102A43] font-semibold">{p.rating.toFixed(1)}</span>
                        <span className="text-[#5B7290]">({p.reviewCount})</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={cn('inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold',
                          p.available ? 'bg-[#E6F7EB] text-[#16A34A]' : 'bg-gray-100 text-gray-500')}>
                          {p.available ? 'Бэлэн' : 'Дууссан'}
                        </span>
                        {p.featured && (
                          <span className="inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold bg-[#FFF5E6] text-[#F59E0B]">
                            Онцлох
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditing(p)}
                          className="grid size-8 place-items-center rounded-lg text-[#5B7290] hover:bg-[#E8F1FF] hover:text-[#1677FF]"
                          aria-label="Засах"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => remove(p.id)}
                          className="grid size-8 place-items-center rounded-lg text-[#5B7290] hover:bg-red-50 hover:text-red-500"
                          aria-label="Устгах"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ProductFormDialog
        open={creating || !!editing}
        product={editing}
        categories={categories}
        saving={saving}
        onClose={() => { setEditing(null); setCreating(false) }}
        onSave={save}
      />
    </div>
  )
}

function ProductFormDialog({
  open, product, categories, saving, onClose, onSave,
}: {
  open: boolean
  product: Product | null
  categories: Category[]
  saving: boolean
  onClose: () => void
  onSave: (data: Partial<Product> & { name: string; price: number; category: string; categoryId: string }) => void
}) {
  const [form, setForm] = useState({
    name: '',
    shortDesc: '',
    description: '',
    price: '',
    oldPrice: '',
    icon: 'Package',
    image: '',
    categoryId: '',
    features: '',
    available: true,
    featured: false,
    duration: '',
    tutorialVideoUrl: '',
    instructionImages: '',
  })
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (product) {
       
      setForm({
        name: product.name,
        shortDesc: product.shortDesc,
        description: product.description,
        price: String(product.price),
        oldPrice: product.oldPrice ? String(product.oldPrice) : '',
        icon: product.icon,
        image: product.image || '',
        categoryId: product.categoryId,
        features: product.features || '',
        available: product.available,
        featured: product.featured,
        duration: product.duration || '',
        tutorialVideoUrl: product.tutorialVideoUrl || '',
        instructionImages: product.instructionImages || '',
      })
    } else if (open) {
       
      setForm({
        name: '',
        shortDesc: '',
        description: '',
        price: '',
        oldPrice: '',
        icon: 'Package',
        image: '',
        categoryId: categories[0]?.id || '',
        features: '',
        available: true,
        featured: false,
        duration: '',
        tutorialVideoUrl: '',
        instructionImages: '',
      })
    }
  }, [product, open, categories])

  const handleImageUpload = async (file: File) => {
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/products/upload', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setForm((f) => ({ ...f, image: data.url }))
      toast.success('Зураг хадгалагдлаа')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Зураг хадгалахад алдаа')
    } finally {
      setUploading(false)
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.price || !form.categoryId) {
      toast.error('Шаардлагатай талбар дутуу байна')
      return
    }
    const cat = categories.find((c) => c.id === form.categoryId)
    onSave({
      name: form.name.trim(),
      shortDesc: form.shortDesc,
      description: form.description,
      price: Number(form.price),
      oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
      icon: form.icon,
      image: form.image.trim() || null,
      categoryId: form.categoryId,
      category: cat?.name || '',
      features: form.features,
      available: form.available,
      featured: form.featured,
      duration: form.duration.trim() || null,
      tutorialVideoUrl: form.tutorialVideoUrl.trim() || null,
      instructionImages: form.instructionImages.trim() || null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 bg-white border-[#D6E4FF] overflow-hidden max-h-[94vh]">
        <DialogTitle className="sr-only">{product ? 'Засах' : 'Шинэ бүтээгдэхүүн'}</DialogTitle>
        <form onSubmit={submit} className="max-h-[94vh] overflow-y-auto custom-scroll">
          <div className="px-6 py-4 border-b border-[#EEF4FF] bg-gradient-to-r from-[#E8F1FF] to-white flex items-center justify-between">
            <h2 className="text-base font-bold text-[#102A43]">{product ? 'Бүтээгдэхүүн засах' : 'Шинэ бүтээгдэхүүн'}</h2>
            <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-full hover:bg-[#E8F1FF]"><X className="size-4" /></button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <Label className="text-xs font-semibold text-[#102A43]">Нэр *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 border-[#D6E4FF]" placeholder="Facebook Account Manager Pro" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#102A43]">Товч тайлбар</Label>
              <Input value={form.shortDesc} onChange={(e) => setForm({ ...form, shortDesc: e.target.value })} className="mt-1 border-[#D6E4FF]" placeholder="Олон аккаунтыг нэг панелаас удирдах" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#102A43]">Бүрэн тайлбар</Label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="mt-1 w-full rounded-md border border-[#D6E4FF] bg-white px-3 py-2 text-sm text-[#102A43] focus:border-[#1677FF] focus:outline-none focus:ring-2 focus:ring-[#1677FF]/10 custom-scroll"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-[#102A43]">Үнэ (₮) *</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1 border-[#D6E4FF]" placeholder="89000" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-[#102A43]">Хуучин үнэ (опц)</Label>
                <Input type="number" value={form.oldPrice} onChange={(e) => setForm({ ...form, oldPrice: e.target.value })} className="mt-1 border-[#D6E4FF]" placeholder="120000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-[#102A43]">Ангилал *</Label>
                <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                  <SelectTrigger className="mt-1 border-[#D6E4FF]">
                    <SelectValue placeholder="Сонгох" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
              <Label className="text-xs font-semibold text-[#102A43]">Дүрслэх дүрс (fallback)</Label>
              <Select value={form.icon} onValueChange={(v) => setForm({ ...form, icon: v })}>
                <SelectTrigger className="mt-1 border-[#D6E4FF]">
                  <SelectValue placeholder="Сонгох" />
                </SelectTrigger>
                <SelectContent>
                  {ICONS.map((i) => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-[11px] text-[#5B7290]">Зураг оруулаагүй үед энэ icon ашиглагдана</p>
            </div>
          </div>

          {/* Product image upload */}
          <div className="rounded-xl border border-[#D6E4FF] bg-[#F5F9FF]/40 p-4 space-y-3">
            <h4 className="text-xs font-bold text-[#0B4DBA] uppercase tracking-wide flex items-center gap-1.5">
              <ImageIcon className="size-3.5" /> Бүтээгдэхүүний зураг
            </h4>
            <div className="flex gap-4 items-start">
              <div className="shrink-0">
                {form.image ? (
                   
                  <img src={form.image} alt="preview" className="size-24 rounded-xl object-cover border border-[#D6E4FF] shadow-premium" />
                ) : (
                  <ProductIllustration icon={form.icon} className="size-24" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <label className="inline-flex items-center gap-2 cursor-pointer rounded-xl bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white text-sm font-semibold px-4 py-2.5 hover:shadow-premium-lg transition-all">
                  {uploading ? (
                    <><Loader2 className="size-4 animate-spin" /> Хадгалж байна...</>
                  ) : (
                    <><Upload className="size-4" /> Зураг сонгох</>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleImageUpload(f)
                    }}
                  />
                </label>
                {form.image && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, image: '' })}
                    className="ml-2 inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="size-3" /> Зураг устгах
                  </button>
                )}
                <p className="text-[11px] text-[#5B7290] leading-relaxed">
                  JPEG, PNG, WebP эсвэл GIF. Хамгийн ихдээ 5MB. Зураг сонгосон даруйд автомат хадгалагдаж, доорх URL талбарт бичигдэнэ.
                </p>
                <Input
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="border-[#D6E4FF] text-xs"
                  placeholder="/uploads/products/... (өөрөө оруулж болно)"
                />
              </div>
            </div>
          </div>
            <div>
              <Label className="text-xs font-semibold text-[#102A43]">Боломжууд (";"-аар тусгаарлана)</Label>
              <Input value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} className="mt-1 border-[#D6E4FF]" placeholder="Cookie нэвтрэлт;Олон аккаунт" />
            </div>

            <div className="rounded-xl border border-[#D6E4FF] bg-[#F5F9FF]/40 p-4 space-y-3">
              <h4 className="text-xs font-bold text-[#0B4DBA] uppercase tracking-wide flex items-center gap-1.5">
                <Clock className="size-3.5" /> Хэрэглээний мэдээлэл
              </h4>
              <div>
                <Label className="text-xs font-semibold text-[#102A43]">Хугацаа (жишээ: 1 сар, 6 сар, 1 жил, Бүх амьдрал)</Label>
                <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="mt-1 border-[#D6E4FF]" placeholder="6 сар" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-[#102A43]">Заавар видео (YouTube URL)</Label>
                <Input value={form.tutorialVideoUrl} onChange={(e) => setForm({ ...form, tutorialVideoUrl: e.target.value })} className="mt-1 border-[#D6E4FF]" placeholder="https://www.youtube.com/watch?v=..." />
                <p className="mt-1 text-[11px] text-[#5B7290]">YouTube link: watch?v=ID эсвэл youtu.be/ID хэлбэрээр оруулна уу</p>
              </div>
              <div>
                <Label className="text-xs font-semibold text-[#102A43]">Зааврын зургууд (";"-аар тусгаарлана)</Label>
                <textarea
                  value={form.instructionImages}
                  onChange={(e) => setForm({ ...form, instructionImages: e.target.value })}
                  rows={3}
                  className="mt-1 w-full rounded-md border border-[#D6E4FF] bg-white px-3 py-2 text-sm text-[#102A43] focus:border-[#1677FF] focus:outline-none custom-scroll"
                  placeholder="https://example.com/step1.png;https://example.com/step2.png"
                />
                <p className="mt-1 text-[11px] text-[#5B7290]">Зурагны URL-үүдийг ";" тэмдэгтээр тусгаарлана. Дэлгэрэнгүй хуудсанд gallery хэлбэрээр харагдана.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm font-medium text-[#102A43] cursor-pointer">
                <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} className="size-4 rounded border-[#D6E4FF] accent-[#1677FF]" />
                Бэлэн байна
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-[#102A43] cursor-pointer">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="size-4 rounded border-[#D6E4FF] accent-[#1677FF]" />
                Онцлох
              </label>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-[#EEF4FF] flex gap-2 bg-[#F5F9FF]/50">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-[#D6E4FF]">Цуцлах</Button>
            <Button type="submit" disabled={saving} className="flex-1 bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white">
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Хадгалах
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
