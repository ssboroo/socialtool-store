'use client'

import { useEffect, useState } from 'react'
import { Copy, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductBulkImport } from './product-bulk-import'
import { toast } from 'sonner'

type Category = { id: string; name: string; slug: string; icon: string }
type Product = {
  id: string
  name: string
  shortDesc: string
  description: string
  price: number
  oldPrice: number | null
  icon: string
  image: string | null
  category: string
  categoryId: string
  available: boolean
  featured: boolean
  features: string | null
  duration: string | null
  tutorialVideoUrl: string | null
  instructionImages: string | null
}

export function ProductAdminTools({ token, categories }: { token: string; categories: Category[] }) {
  const [products, setProducts] = useState<Product[]>([])
  const [selected, setSelected] = useState('')
  const [duplicating, setDuplicating] = useState(false)

  useEffect(() => {
    fetch('/api/admin/products', { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' })
      .then(r => r.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [token])

  const duplicate = async () => {
    const source = products.find(p => p.id === selected)
    if (!source) return toast.error('Хуулах бүтээгдэхүүнээ сонгоно уу')
    setDuplicating(true)
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: `${source.name} — хуулбар`,
          shortDesc: source.shortDesc,
          description: source.description,
          price: source.price,
          oldPrice: source.oldPrice,
          icon: source.icon,
          image: source.image,
          category: source.category,
          categoryId: source.categoryId,
          available: source.available,
          featured: false,
          features: source.features,
          duration: source.duration,
          tutorialVideoUrl: source.tutorialVideoUrl,
          instructionImages: source.instructionImages,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Хуулбарлаж чадсангүй')
      toast.success('Бүтээгдэхүүний хуулбар үүслээ')
      window.location.reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Хуулбарлаж чадсангүй')
      setDuplicating(false)
    }
  }

  return (
    <div className="mb-4 rounded-2xl border border-[#D6E4FF] bg-white p-3 shadow-premium sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#102A43]">Хурдан удирдлага</h3>
          <p className="mt-0.5 text-xs text-[#5B7290]">Олон бараа CSV-ээр оруулах, зураг бөөнөөр холбох эсвэл одоо байгаа барааг хуулбарлах.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <ProductBulkImport token={token} categories={categories} onImported={() => window.location.reload()} />
          <div className="flex min-w-0 items-center gap-2">
            <select
              value={selected}
              onChange={e => setSelected(e.target.value)}
              aria-label="Хуулах бүтээгдэхүүн"
              className="h-10 min-w-0 flex-1 rounded-full border border-[#D6E4FF] bg-white px-3 text-sm text-[#102A43] sm:w-64"
            >
              <option value="">Бараа сонгох…</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <Button type="button" variant="outline" disabled={!selected || duplicating} onClick={() => void duplicate()} className="rounded-full border-[#D6E4FF] gap-1.5 whitespace-nowrap">
              {duplicating ? <Loader2 className="size-4 animate-spin" /> : <Copy className="size-4" />} Хуулбарлах
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
