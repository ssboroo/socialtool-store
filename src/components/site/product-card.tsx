'use client'

import { useState } from 'react'
import { LicenseSelector } from './license-selector'
import { licensePrice, licenseOptions, type LicenseTerm } from '@/lib/license'
import { Star, ShoppingCart, ArrowRight, PlayCircle } from 'lucide-react'
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
  const hasTutorial = Boolean(product.tutorialVideoUrl && getYouTubeId(product.tutorialVideoUrl))

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
    <article
      onClick={openDetail}
      className="group relative flex h-full min-h-[480px] self-stretch cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#D6E4FF] bg-white shadow-premium transition-all duration-300 hover:-translate-y-1 hover:border-[#1677FF]/40 hover:shadow-premium-lg"
    >
      {product.discount ? (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-gradient-to-r from-[#F59E0B] to-[#DC2626] px-2.5 py-1 text-[11px] font-bold text-white shadow-premium">
          -{product.discount}%
        </span>
      ) : null}

      <span className="absolute right-3 top-3 z-10 max-w-[70%] truncate rounded-full border border-[#D6E4FF] bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#0B4DBA] shadow-sm backdrop-blur" title={product.category}>
        {product.category}
      </span>

      <ProductImage
        image={product.image}
        icon={product.icon}
        alt={product.name}
        className={cn('aspect-[16/10] w-full shrink-0 rounded-none', compact && 'aspect-[16/9]')}
      />

      <div className={cn('flex min-h-0 flex-1 flex-col', compact ? 'p-4' : 'p-4 lg:p-5')}>
        <div className="flex min-h-5 items-center gap-1.5">
          <div className="flex shrink-0 items-center gap-0.5" aria-label={`${product.rating.toFixed(1)} үнэлгээ`}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Star
                key={i}
                className={cn(
                  'size-3.5',
                  i < Math.round(product.rating)
                    ? 'fill-[#F59E0B] text-[#F59E0B]'
                    : 'fill-[#D6E4FF] text-[#D6E4FF]'
                )}
              />
            ))}
          </div>
          <span className="truncate text-xs leading-5 text-[#5B7290]">
            {product.rating.toFixed(1)} ({product.reviewCount})
          </span>
        </div>

        <h3 className="mt-2 min-h-[44px] line-clamp-2 text-[15px] font-bold leading-[22px] text-[#102A43] [overflow-wrap:anywhere]">
          {product.name}
        </h3>

        <p className="mt-1 min-h-10 line-clamp-2 text-xs leading-5 text-[#5B7290] [overflow-wrap:anywhere]">
          {product.shortDesc}
        </p>

        <div className="mt-3 flex min-h-8 items-end gap-2">
          <span className="text-xl font-extrabold leading-8 tracking-[-0.02em] text-[#102A43]">
            {formatTugrik(licensePrice(product, selectedDuration))}
          </span>
          {product.oldPrice ? (
            <span className="pb-1 text-xs text-[#5B7290] line-through">
              {formatTugrik(product.oldPrice)}
            </span>
          ) : null}
        </div>

        <div className="min-h-[76px]">
          {options.length > 0 ? (
            <LicenseSelector value={selectedDuration} onChange={setDuration} options={options} />
          ) : null}
        </div>

        <div className="min-h-7 pt-1">
          {hasTutorial ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium leading-5 text-[#1677FF]">
              <PlayCircle className="size-3.5 shrink-0" /> Видео заавартай
            </span>
          ) : null}
        </div>

        <div className="mt-auto grid gap-2 pt-3">
          <Button
            disabled={!product.available}
            onClick={handleAdd}
            size="sm"
            className="h-10 w-full rounded-xl bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-sm font-semibold text-white shadow-premium hover:shadow-premium-lg"
          >
            <ShoppingCart className="size-4" />
            {product.available ? 'Сагсанд нэмэх' : 'Түр дууссан'}
          </Button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              openDetail()
            }}
            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-[#D6E4FF] bg-white px-3 text-xs font-semibold text-[#102A43] transition-colors hover:bg-[#E8F1FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF]"
          >
            Дэлгэрэнгүй
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </article>
  )
}
