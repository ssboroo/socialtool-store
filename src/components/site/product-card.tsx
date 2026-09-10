'use client'

import { useState } from 'react'
import { LicenseSelector } from './license-selector'
import { licensePrice, licenseOptions, type LicenseTerm } from '@/lib/license'
import { Star, ShoppingCart, ArrowRight, Clock, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductImage } from './product-illustration'
import { useCartStore, useUIStore } from '@/store/cart'
import { formatTugrik } from '@/lib/format'
import { getYouTubeId } from '@/lib/media'
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
    add({
      id: product.id,
      duration: selectedDuration,
      name: product.name,
      price: licensePrice(product, selectedDuration),
      icon: product.icon,
      category: product.category,
    })
    toast.success(`${product.name} сагсанд нэмэгдлээ`)
  }

  const openDetail = () => setSelectedProduct(product.id)

  return (
    <div
      onClick={openDetail}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#D6E4FF] bg-white shadow-premium transition-all duration-300 hover:-translate-y-1 hover:shadow-premium-lg hover:border-[#1677FF]/40"
    >
      {product.discount ? (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-gradient-to-r from-[#F59E0B] to-[#DC2626] px-2.5 py-1 text-[11px] font-bold text-white shadow-premium">
          -{product.discount}%
        </span>
      ) : null}
      <span className="absolute right-3 top-3 z-10 rounded-full bg-white/90 backdrop-blur border border-[#D6E4FF] px-2.5 py-1 text-[11px] font-semibold text-[#0B4DBA]">
        {product.category}
      </span>
      <ProductImage image={product.image} icon={product.icon} alt={product.name} className={cn('aspect-[16/10] w-full')} />

      <div className="flex flex-1 flex-col p-4 lg:p-5">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star
                key={i}
                className={cn(
                  'size-3.5',
                  i < Math.round(product.rating)
                    ? 'text-[#F59E0B] fill-[#F59E0B]'
                    : 'text-[#D6E4FF] fill-[#D6E4FF]'
                )}
              />
            ))}
          </div>
          <span className="text-xs text-[#5B7290]">
            {product.rating.toFixed(1)} ({product.reviewCount})
          </span>
        </div>

        <h3 className="mt-2 text-[15px] font-bold leading-snug text-[#102A43] line-clamp-1">
          {product.name}
        </h3>
        <p className="mt-1 text-xs text-[#5B7290] line-clamp-2">{product.shortDesc}</p>

        <div className="mt-3 flex items-end gap-2">
          <span className="text-xl font-extrabold text-[#102A43]">
            {formatTugrik(licensePrice(product, selectedDuration))}
          </span>
          {product.oldPrice ? (
            <span className="text-xs text-[#5B7290] line-through">
              {formatTugrik(product.oldPrice)}
            </span>
          ) : null}
        </div>

        <LicenseSelector value={selectedDuration} onChange={setDuration} options={options} />
        {product.tutorialVideoUrl && getYouTubeId(product.tutorialVideoUrl) && <span className="mt-3 inline-flex items-center gap-1 text-xs text-[#1677FF]"><PlayCircle className="size-3.5" /> Видео заавартай</span>}
        <div className="mt-auto pt-4 flex flex-wrap items-center gap-2">
          <Button
            disabled={!product.available}
            onClick={handleAdd}
            size="sm"
            className="h-9 flex-1 rounded-xl bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white shadow-premium hover:shadow-premium-lg gap-1.5"
          >
            <ShoppingCart className="size-4" />
            Сагсанд нэмэх
          </Button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              openDetail()
            }}
            className="inline-flex h-9 items-center gap-1 rounded-xl border border-[#D6E4FF] bg-white px-3 text-xs font-semibold text-[#102A43] hover:bg-[#E8F1FF] transition-colors"
          >
            Дэлгэрэнгүй
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
