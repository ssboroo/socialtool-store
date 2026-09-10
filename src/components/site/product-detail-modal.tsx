'use client'
import { LicenseSelector } from './license-selector'
import { licenseOptions, type LicenseTerm } from '@/lib/license'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Star, ShoppingCart, Check, ShieldCheck, Zap, Loader2, Clock, PlayCircle, ImageIcon, X } from 'lucide-react'
import { useUIStore } from '@/store/cart'
import { useCartStore } from '@/store/cart'
import { ProductImage } from './product-illustration'
import { formatTugrik } from '@/lib/format'
import { getYouTubeId, getYouTubeEmbedUrl, getYouTubeThumb, parseImageList } from '@/lib/media'
import { toast } from 'sonner'
import { ProductDescription } from './product-description'

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
  image?: string | null
  category: string
  rating: number
  reviewCount: number
  features?: string | null
  duration?: string | null
  tutorialVideoUrl?: string | null
  instructionImages?: string | null
}

export function ProductDetailModal() {
  const selectedId = useUIStore((s) => s.selectedProductId)
  const setSelectedProduct = useUIStore((s) => s.setSelectedProduct)
  const openCart = useCartStore((s) => s.open)
  const add = useCartStore((s) => s.add)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [duration, setDuration] = useState<LicenseTerm>('')
  const [qty, setQty] = useState(1)
  const [videoPlaying, setVideoPlaying] = useState(false)
  const [activeImage, setActiveImage] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProduct(null)
      return
    }
    let cancelled = false
     
    setLoading(true)
     
    setQty(1)
    setDuration('')
     
    setVideoPlaying(false)
     
    setActiveImage(null)
    fetch(`/api/products/${selectedId}`)
      .then(async (r) => { if (!r.ok) throw new Error('Бүтээгдэхүүн татаж чадсангүй'); return r.json() })
      .then((d) => { if (!cancelled) setProduct(d) })
      .catch(() => { if (!cancelled) setProduct(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [selectedId])

  const options = licenseOptions(product?.duration)
  const selectedDuration = options.includes(duration) ? duration : options[0] || ''

  const handleAdd = () => {
    if (!product) return
    add(
      {
        id: product.id,
        duration: selectedDuration,
        name: product.name,
        price: product.price,
        icon: product.icon,
        category: product.category,
      },
      qty
    )
    toast.success(`${product.name} сагсанд нэмэгдлээ`)
    setSelectedProduct(null)
    setTimeout(() => openCart(), 200)
  }

  const features = product?.features
    ? product.features.split(';').filter(Boolean)
    : []

  return (
    <Dialog
      open={!!selectedId}
      onOpenChange={(o) => !o && setSelectedProduct(null)}
    >
      <DialogContent className="sm:max-w-4xl p-0 bg-white border-[#D6E4FF] overflow-hidden max-h-[92vh]">
        <DialogTitle className="sr-only">{product?.name || 'Хэрэгсэл'}</DialogTitle>
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-8 animate-spin text-[#1677FF]" />
          </div>
        ) : product ? (
          <div className="flex flex-col max-h-[92vh] overflow-y-auto custom-scroll">
            {/* illustration */}
            <div className="relative bg-gradient-to-br from-[#E8F1FF] to-[#F5F9FF] p-6 sm:p-8">
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="rounded-full bg-white/90 backdrop-blur border border-[#D6E4FF] px-2.5 py-1 text-[11px] font-semibold text-[#0B4DBA]">
                  {product.category}
                </span>
                {product.discount ? (
                  <span className="rounded-full bg-gradient-to-r from-[#F59E0B] to-[#DC2626] px-2.5 py-1 text-[11px] font-bold text-white">
                    -{product.discount}%
                  </span>
                ) : null}
              </div>
              <ProductImage image={product.image} icon={product.icon} alt={product.name} className="h-[220px] sm:h-[260px] w-full max-w-md mx-auto mt-6" />
            </div>

            {/* info */}
            <div className="min-w-0 p-6 sm:p-8 flex flex-col">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`size-4 ${i < Math.round(product.rating) ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-[#D6E4FF] fill-[#D6E4FF]'}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-[#5B7290]">
                  {product.rating.toFixed(1)} · {product.reviewCount} сэтгэгдэл
                </span>
              </div>

              <h2 className="mt-2 text-2xl font-extrabold text-[#102A43] leading-tight">
                {product.name}
              </h2>
              <p className="mt-1.5 text-sm text-[#5B7290]">{product.shortDesc}</p>

              <div className="mt-4 flex items-end gap-3">
                <span className="text-3xl font-extrabold text-[#102A43]">
                  {formatTugrik(product.price)}
                </span>
                {product.oldPrice ? (
                  <span className="text-sm text-[#5B7290] line-through">
                    {formatTugrik(product.oldPrice)}
                  </span>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#E6F7EB] px-2.5 py-1 text-xs font-semibold text-[#16A34A]">
                  <Check className="size-3.5" /> Баталгаатай
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8F1FF] px-2.5 py-1 text-xs font-semibold text-[#1677FF]">
                  <Zap className="size-3.5" /> Шууд хүргэгдэнэ
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F0EAFF] px-2.5 py-1 text-xs font-semibold text-[#8B5CF6]">
                  <ShieldCheck className="size-3.5" /> 7 хоног баталгаа
                </span>

              </div>

              {features.length > 0 && (
                <div className="mt-5">
                  <h4 className="text-sm font-bold text-[#102A43]">Боломжууд</h4>
                  <ul className="mt-2.5 space-y-1.5">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-[#5B7290]">
                        <Check className="mt-0.5 size-4 shrink-0 text-[#16A34A]" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <section className="mt-6 border-t border-[#D6E4FF] pt-6">
                <h4 className="text-xl font-bold text-[#102A43]">Бүтээгдэхүүний тайлбар</h4>
                <ProductDescription text={product.description} />
              </section>

              {/* Tutorial video (YouTube) */}
              {(() => {
                const ytId = product.tutorialVideoUrl ? getYouTubeId(product.tutorialVideoUrl) : null
                if (!ytId) return null
                return (
                  <div className="mt-5">
                    <h4 className="text-sm font-bold text-[#102A43] flex items-center gap-1.5">
                      <PlayCircle className="size-4 text-[#1677FF]" /> Ашиглах заавар видео
                    </h4>
                    <a href={`https://www.youtube.com/watch?v=${ytId}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-[#1677FF] underline">YouTube дээр нээх ↗</a>
                    <div className="mt-2.5 relative overflow-hidden rounded-xl border border-[#D6E4FF] bg-black/5 aspect-video">
                      {videoPlaying ? (
                        <iframe
                          src={getYouTubeEmbedUrl(ytId) + '&autoplay=1'}
                          title={`${product.name} заавар видео`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          referrerPolicy="strict-origin-when-cross-origin"
                          className="absolute inset-0 size-full"
                        />
                      ) : (
                        <button
                          onClick={() => setVideoPlaying(true)}
                          className="absolute inset-0 size-full group"
                          aria-label="Видео тоглуулах"
                        >
                          { }
                          <img
                            src={getYouTubeThumb(ytId)}
                            alt={product.name + ' заавар видео'}
                            className="absolute inset-0 size-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
                          <div className="absolute inset-0 grid place-items-center">
                            <div className="relative">
                              <div className="absolute inset-0 rounded-full bg-[#1677FF] blur-xl opacity-50" />
                              <div className="relative grid size-16 place-items-center rounded-full bg-gradient-to-br from-[#1677FF] to-[#0B4DBA] shadow-premium-lg group-hover:scale-110 transition-transform">
                                <PlayCircle className="size-9 text-white" />
                              </div>
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })()}

              {/* Instruction images gallery */}
              {(() => {
                const images = parseImageList(product.instructionImages)
                if (images.length === 0) return null
                return (
                  <div className="mt-5">
                    <h4 className="text-sm font-bold text-[#102A43] flex items-center gap-1.5">
                      <ImageIcon className="size-4 text-[#1677FF]" /> Хийх зааврын зураг ({images.length})
                    </h4>
                    <div className="mt-2.5 grid grid-cols-3 gap-2">
                      {images.map((src, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveImage(src)}
                          className="group relative aspect-video overflow-hidden rounded-lg border border-[#D6E4FF] bg-[#F5F9FF]"
                          aria-label={`Зураг ${i + 1}`}
                        >
                          { }
                          <img
                            src={src}
                            alt={`${product.name} заавар зураг ${i + 1}`}
                            className="absolute inset-0 size-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <span className="absolute left-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-black/60 text-white text-[10px] font-bold">
                            {i + 1}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* qty + add */}
              <LicenseSelector value={selectedDuration} onChange={setDuration} options={options} />
              <div className="mt-auto pt-5 flex items-center gap-3">
                <div className="inline-flex items-center rounded-xl border border-[#D6E4FF] bg-white">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="grid size-10 place-items-center text-[#5B7290] hover:text-[#1677FF] disabled:opacity-40"
                    disabled={qty <= 1}
                  >
                    −
                  </button>
                  <span className="min-w-10 text-center text-sm font-bold text-[#102A43]">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="grid size-10 place-items-center text-[#5B7290] hover:text-[#1677FF]"
                  >
                    +
                  </button>
                </div>
                <Button
                  onClick={handleAdd}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white shadow-premium-lg gap-2"
                >
                  <ShoppingCart className="size-4" />
                  Сагсанд нэмэх · {formatTugrik(product.price * qty)}
                </Button>
              </div>
            </div>
          </div>
        ) : <p role="alert" className="p-8 text-center text-sm">Бүтээгдэхүүн татаж чадсангүй. Цонхыг хаагаад дахин нээнэ үү.</p>}

        {/* Image lightbox */}
        {activeImage && (
          <div
            className="fixed inset-0 z-[60] grid place-items-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out"
            onClick={() => setActiveImage(null)}
            role="dialog"
            aria-label="Зураг томоор үзэх"
          >
            <button
              className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-white/15 backdrop-blur text-white hover:bg-white/25"
              onClick={(e) => { e.stopPropagation(); setActiveImage(null) }}
              aria-label="Хаах"
            >
              <X className="size-5" />
            </button>
            { }
            <img
              src={activeImage}
              alt="Зааврын зураг томоор"
              className="max-h-[88vh] max-w-full rounded-xl shadow-premium-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
