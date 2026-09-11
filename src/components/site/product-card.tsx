'use client'

import { Star, ShoppingCart, ArrowRight, Clock, PlayCircle, CircleOff } from 'lucide-react'
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
  const add = useCartStore((s) => s.add)
  const setSelectedProduct = useUIStore((s) => s.setSelectedProduct)

  const handleAdd = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!product.available) {
      toast.error('Энэ бүтээгдэхүүн түр дууссан байна')
      return
    }
    add({
      id: product.id,
      name: product.name,
      price: product.price,
      icon: product.icon,
      category: product.category,
    })
    toast.success(`${product.name} сагсанд нэмэгдлээ`)
  }

  const openDetail = () => setSelectedProduct(product.id)

  return (
    <article
      onClick={openDetail}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
          e.preventDefault()
          openDetail()
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`${product.name} дэлгэрэнгүй мэдээлэл`}
      className={cn(
        'group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-white shadow-premium transition-all duration-300 focus-visible:border-[#1677FF]',
        product.available
          ? 'border-[#D6E4FF] hover:-translate-y-1 hover:shadow-premium-lg hover:border-[#1677FF]/40'
          : 'border-slate-200 opacity-90',
      )}
    >
      {product.discount ? (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-gradient-to-r from-[#F59E0B] to-[#DC2626] px-2.5 py-1 text-[11px] font-bold text-white shadow-premium">
          -{product.discount}%
        </span>
      ) : null}
      <span className="absolute right-3 top-3 z-10 max-w-[54%] truncate rounded-full border border-[#D6E4FF] bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#0B4DBA] backdrop-blur">
        {product.category}
      </span>
      {!product.available ? (
        <span className="absolute left-3 top-12 z-10 inline-flex items-center gap-1 rounded-full bg-slate-800/90 px-2.5 py-1 text-[10px] font-bold text-white shadow-premium">
          <CircleOff className="size-3" /> Түр дууссан
        </span>
      ) : null}
      {product.duration ? (
        <span className="absolute left-3 bottom-3 z-10 inline-flex items-center gap-1 rounded-full border border-[#F59E0B]/20 bg-[#FFF5E6] px-2 py-0.5 text-[10px] font-bold text-[#92400E] shadow-premium">
          <Clock className="size-2.5" /> {product.duration}
        </span>
      ) : null}
      {product.tutorialVideoUrl && getYouTubeId(product.tutorialVideoUrl) ? (
        <span className="absolute right-3 bottom-3 z-10 inline-flex items-center gap-1 rounded-full bg-[#1677FF] px-2 py-0.5 text-[10px] font-bold text-white shadow-premium">
          <PlayCircle className="size-2.5" /> Видео
        </span>
      ) : null}

      <div className="overflow-hidden bg-[#F5F9FF]">
        <ProductImage
          image={product.image}
          icon={product.icon}
          alt={product.name}
          className={cn(
            compact ? 'aspect-[4/3] w-full' : 'aspect-[16/10] w-full',
            'transition-transform duration-500 group-hover:scale-[1.025]',
            !product.available && 'grayscale-[20%]',
          )}
        />
      </div>

      <div className={cn('flex flex-1 flex-col', compact ? 'p-4' : 'p-4 lg:p-5')}>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5" aria-label={`${product.rating.toFixed(1)} үнэлгээ`}>
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
          <span className="text-xs text-[#5B7290]">
            {product.rating.toFixed(1)} ({product.reviewCount})
          </span>
        </div>

        <h3 className="mt-2 line-clamp-2 min-h-[2.5rem] text-[15px] font-bold leading-snug text-[#102A43]">
          {product.name}
        </h3>
        <p className="mt-1 line-clamp-2 min-h-[2rem] text-xs leading-relaxed text-[#5B7290]">{product.shortDesc}</p>

        <div className="mt-3 flex flex-wrap items-end gap-x-2 gap-y-1">
          <span className="text-xl font-extrabold tracking-tight text-[#102A43]">
            {formatTugrik(product.price)}
          </span>
          {product.oldPrice ? (
            <span className="text-xs text-[#5B7290] line-through">
              {formatTugrik(product.oldPrice)}
            </span>
          ) : null}
        </div>

        <div className="mt-auto pt-4 flex items-center gap-2">
          <Button
            onClick={handleAdd}
            disabled={!product.available}
            size="sm"
            className={cn(
              'h-9 flex-1 rounded-xl gap-1.5',
              product.available
                ? 'bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white shadow-premium hover:shadow-premium-lg'
                : 'cursor-not-allowed bg-slate-200 text-slate-500 hover:bg-slate-200',
            )}
          >
            {product.available ? <ShoppingCart className="size-4" /> : <CircleOff className="size-4" />}
            {product.available ? 'Сагсанд нэмэх' : 'Түр дууссан'}
          </Button>
          <button
            type="button"
            aria-label={`${product.name} дэлгэрэнгүй`}
            onClick={(e) => {
              e.stopPropagation()
              openDetail()
            }}
            className="inline-flex h-9 shrink-0 items-center gap-1 rounded-xl border border-[#D6E4FF] bg-white px-3 text-xs font-semibold text-[#102A43] transition-colors hover:bg-[#E8F1FF]"
          >
            Дэлгэрэнгүй
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </article>
  )
}
