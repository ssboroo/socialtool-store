'use client'

import { useState } from 'react'
import { LicenseSelector } from './license-selector'
import { licensePrice, licenseOptions, type LicenseTerm } from '@/lib/license'
import { ArrowRight, ShoppingCart, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductImage } from './product-illustration'
import { useCartStore, useUIStore } from '@/store/cart'
import { formatTugrik } from '@/lib/format'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export interface Product {
  id: string
  name: string
  slug: string
  shortDesc: string
  description: string
  price: number
  oldPrice: number | null
  discount: number | null
  icon: string
  image?: string | null
  category: string
  rating: number
  reviewCount: number
  available: boolean
  features?: string | null
  duration?: string | null
  tutorialVideoUrl?: string | null
  instructionImages?: string | null
}

export function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const [duration, setDuration] = useState<LicenseTerm>('')
  const add = useCartStore((s) => s.add)
  const setSelectedProduct = useUIStore((s) => s.setSelectedProduct)
  const options = licenseOptions(product?.duration)
  const selectedDuration = options.includes(duration) ? duration : options[0] || ''

  const handleAdd = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    add({ id: product.id, duration: selectedDuration, name: product.name, price: licensePrice(product, selectedDuration), icon: product.icon, category: product.category })
    toast.success(`${product.name} сагсанд нэмэгдлээ`)
  }

  return (
    <article
      onClick={() => setSelectedProduct(product.id)}
      className="group relative flex h-full min-h-[404px] cursor-pointer flex-col overflow-hidden rounded-[18px] border border-[#DCE8F7] bg-white shadow-[0_8px_28px_rgba(31,81,135,.07)] transition duration-300 hover:-translate-y-1 hover:border-[#BFD8FA] hover:shadow-[0_18px_38px_rgba(31,81,135,.13)]"
    >
      {product.discount ? <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-[#FFB547] px-2 py-1 text-[10px] font-extrabold text-[#704000]">-{product.discount}%</span> : null}
      <span className="absolute right-2.5 top-2.5 z-10 max-w-[74%] truncate rounded-full border border-[#BFD8FA] bg-white/95 px-2 py-1 text-[9px] font-bold text-[#1677FF] shadow-sm" title={product.category}>{product.category}</span>

      <ProductImage image={product.image} icon={product.icon} alt={product.name} className={cn('aspect-[16/9] w-full shrink-0 rounded-none', compact && 'aspect-[16/10]')} />

      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="min-h-[40px] line-clamp-2 text-[14px] font-extrabold leading-5 tracking-[-0.015em] text-[#102A43] [overflow-wrap:anywhere]">{product.name}</h3>
        <p className="mt-1 min-h-[36px] line-clamp-2 text-[11px] font-medium leading-[18px] text-[#6B819A] [overflow-wrap:anywhere]">{product.shortDesc}</p>

        <div className="mt-2 flex min-h-5 items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {[0, 1, 2, 3, 4].map((i) => <Star key={i} className={cn('size-3', i < Math.round(product.rating) ? 'fill-[#FFAA00] text-[#FFAA00]' : 'fill-[#DFE8F2] text-[#DFE8F2]')} />)}
          </div>
          <span className="text-[10px] font-medium text-[#7187A2]">{product.rating.toFixed(1)} ({product.reviewCount})</span>
        </div>

        <div className="mt-2 flex items-end gap-2">
          <span className="text-[20px] font-black leading-7 tracking-[-0.03em] text-[#102A43]">{formatTugrik(licensePrice(product, selectedDuration))}</span>
          {product.oldPrice ? <span className="pb-0.5 text-[10px] text-[#8AA0B8] line-through">{formatTugrik(product.oldPrice)}</span> : null}
        </div>

        <div className="min-h-[52px]">
          {options.length > 0 ? <LicenseSelector value={selectedDuration} onChange={setDuration} options={options} compact /> : null}
        </div>

        <div className="mt-auto grid gap-2 pt-2">
          <Button disabled={!product.available} onClick={handleAdd} size="sm" className="h-9 w-full rounded-[10px] bg-[#1677FF] text-[11px] font-bold text-white shadow-none hover:bg-[#0D69E6]">
            <ShoppingCart className="size-3.5" /> {product.available ? 'Сагсанд нэмэх' : 'Түр дууссан'}
          </Button>
          <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedProduct(product.id) }} className="inline-flex h-9 w-full items-center justify-center gap-1 rounded-[10px] border border-[#D7E4F3] bg-white text-[10px] font-bold text-[#244564] transition hover:bg-[#F4F8FE]">
            Дэлгэрэнгүй <ArrowRight className="size-3" />
          </button>
        </div>
      </div>
    </article>
  )
}
