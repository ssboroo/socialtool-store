'use client'

import { useEffect, useState } from 'react'
import { Check, Loader2, PlayCircle, ShieldCheck, ShoppingCart, Star, X, Zap } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LicenseSelector } from './license-selector'
import { licenseOptions, licensePrice, type LicenseTerm } from '@/lib/license'
import { useCartStore, useUIStore } from '@/store/cart'
import { ProductImage } from './product-illustration'
import { formatTugrik } from '@/lib/format'
import { getYouTubeEmbedUrl, getYouTubeId, getYouTubeThumb, parseImageList } from '@/lib/media'
import { ProductDescription } from './product-description'
import { toast } from 'sonner'

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
      .then((data) => { if (!cancelled) setProduct(data) })
      .catch(() => { if (!cancelled) setProduct(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [selectedId])

  const options = licenseOptions(product?.duration)
  const selectedDuration = options.includes(duration) ? duration : options[0] || ''
  const features = product?.features ? product.features.split(';').map((f) => f.trim()).filter(Boolean) : []
  const images = parseImageList(product?.instructionImages)
  const ytId = product?.tutorialVideoUrl ? getYouTubeId(product.tutorialVideoUrl) : null

  const handleAdd = () => {
    if (!product) return
    add({ id: product.id, duration: selectedDuration, name: product.name, price: licensePrice(product, selectedDuration), icon: product.icon, category: product.category }, qty)
    toast.success(`${product.name} сагсанд нэмэгдлээ`)
    setSelectedProduct(null)
    setTimeout(() => openCart(), 180)
  }

  return (
    <Dialog open={!!selectedId} onOpenChange={(open) => !open && setSelectedProduct(null)}>
      <DialogContent className="max-h-[92vh] overflow-hidden border-[#DCE8F7] bg-[#F7FAFE] p-0 sm:max-w-[1180px]">
        <DialogTitle className="sr-only">{product?.name || 'Бүтээгдэхүүн'}</DialogTitle>
        {loading ? (
          <div className="flex min-h-[420px] items-center justify-center"><Loader2 className="size-8 animate-spin text-[#1677FF]" /></div>
        ) : product ? (
          <div className="max-h-[92vh] overflow-y-auto p-3 custom-scroll sm:p-4">
            <div className="grid gap-3 lg:grid-cols-[340px_minmax(0,1fr)_390px]">
              <section className="rounded-[20px] border border-[#DCE8F7] bg-white p-3 shadow-[0_8px_28px_rgba(31,81,135,.06)]">
                <div className="relative overflow-hidden rounded-[16px] bg-[#EAF4FF]">
                  <span className="absolute right-3 top-3 z-10 rounded-full border border-[#BFD8FA] bg-white/95 px-2 py-1 text-[10px] font-bold text-[#1677FF]">{product.category}</span>
                  <ProductImage image={product.image} icon={product.icon} alt={product.name} className="aspect-square w-full rounded-none" />
                </div>

                {(images.length > 0 || ytId) && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    <button className="relative aspect-square overflow-hidden rounded-xl border-2 border-[#1677FF] bg-[#EEF5FF]" onClick={() => setActiveImage(product.image || null)}>
                      <ProductImage image={product.image} icon={product.icon} alt={product.name} className="size-full rounded-none" />
                    </button>
                    {images.slice(0, 2).map((src, index) => (
                      <button key={src} onClick={() => setActiveImage(src)} className="relative aspect-square overflow-hidden rounded-xl border border-[#DCE8F7] bg-[#F4F8FE]">
                        <img src={src} alt={`Зааврын зураг ${index + 1}`} className="absolute inset-0 size-full object-cover" />
                      </button>
                    ))}
                    {ytId && (
                      <button onClick={() => setVideoPlaying(true)} className="relative aspect-square overflow-hidden rounded-xl border border-[#DCE8F7] bg-black">
                        <img src={getYouTubeThumb(ytId)} alt="Видео заавар" className="absolute inset-0 size-full object-cover opacity-70" />
                        <PlayCircle className="absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 text-white" />
                      </button>
                    )}
                  </div>
                )}
              </section>

              <section className="flex min-w-0 flex-col rounded-[20px] border border-[#DCE8F7] bg-white p-5 shadow-[0_8px_28px_rgba(31,81,135,.06)] sm:p-6">
                <p className="text-[10px] font-semibold text-[#7890AA]">Нүүр / {product.category} / {product.name}</p>
                <h2 className="mt-3 text-[26px] font-black leading-tight tracking-[-0.035em] text-[#102A43]">{product.name}</h2>

                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`size-3.5 ${i < Math.round(product.rating) ? 'fill-[#FFAA00] text-[#FFAA00]' : 'fill-[#DFE8F2] text-[#DFE8F2]'}`} />)}</div>
                  <span className="text-[11px] font-medium text-[#7187A2]">{product.rating.toFixed(1)} ({product.reviewCount} сэтгэгдэл)</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#16A34A]"><Check className="size-3.5" /> Баталгаатай</span>
                </div>

                <p className="mt-4 text-[13px] font-medium leading-6 text-[#5E7691]">{product.shortDesc}</p>

                <div className="mt-5">
                  <span className="text-[11px] font-semibold text-[#7187A2]">Үнэ</span>
                  <div className="mt-1 flex items-end gap-2">
                    <span className="text-[30px] font-black tracking-[-0.035em] text-[#102A43]">{formatTugrik(licensePrice(product, selectedDuration))}</span>
                    {product.oldPrice ? <span className="pb-1 text-xs text-[#8AA0B8] line-through">{formatTugrik(product.oldPrice)}</span> : null}
                  </div>
                </div>

                <LicenseSelector value={selectedDuration} onChange={setDuration} options={options} />

                <div className="mt-5 flex items-center gap-2">
                  <div className="inline-flex h-11 items-center rounded-xl border border-[#D9E5F4] bg-white">
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} className="grid size-10 place-items-center text-[#58718F] disabled:opacity-35">−</button>
                    <span className="min-w-8 text-center text-sm font-extrabold text-[#102A43]">{qty}</span>
                    <button onClick={() => setQty((q) => q + 1)} className="grid size-10 place-items-center text-[#58718F]">+</button>
                  </div>
                  <Button onClick={handleAdd} className="h-11 flex-1 rounded-xl bg-[#1677FF] text-[12px] font-bold text-white hover:bg-[#0D69E6]">
                    <ShoppingCart className="size-4" /> Сагсанд нэмэх
                  </Button>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-[#EEF3F9] pt-4">
                  {[
                    [Zap, 'Шуурхай хүргэлт', 'Автоматаар илгээх'],
                    [ShieldCheck, '100% Найдвартай', 'Баталгаат үйлчилгээ'],
                    [Check, '7 хоног баталгаа', 'Тусламжтай'],
                  ].map(([Icon, title, subtitle]) => (
                    <div key={String(title)} className="text-center">
                      <Icon className="mx-auto size-4 text-[#1677FF]" />
                      <p className="mt-1 text-[9px] font-extrabold text-[#274867]">{String(title)}</p>
                      <p className="text-[8px] leading-3 text-[#8AA0B8]">{String(subtitle)}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="min-w-0 rounded-[20px] border border-[#DCE8F7] bg-white p-4 shadow-[0_8px_28px_rgba(31,81,135,.06)] sm:p-5">
                <div className="flex gap-1 overflow-x-auto border-b border-[#E9F0F8] text-[10px] font-bold text-[#617A96]">
                  <span className="shrink-0 border-b-2 border-[#1677FF] px-2 pb-3 text-[#1677FF]">Бүтээгдэхүүний тайлбар</span>
                  <span className="shrink-0 px-2 pb-3">Онцлог</span>
                  <span className="shrink-0 px-2 pb-3">Системийн шаардлага</span>
                </div>

                <h3 className="mt-4 text-[15px] font-extrabold text-[#102A43]">Бүтээгдэхүүний тайлбар</h3>
                <div className="mt-1 max-h-[240px] overflow-y-auto pr-1 custom-scroll">
                  <ProductDescription text={product.description} />
                </div>

                {features.length > 0 && (
                  <div className="mt-4 border-t border-[#EEF3F9] pt-4">
                    <h4 className="text-[13px] font-extrabold text-[#102A43]">Үндсэн боломжууд</h4>
                    <ul className="mt-2.5 space-y-2">
                      {features.slice(0, 8).map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-[11px] font-medium leading-5 text-[#5E7691]">
                          <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-[#E9F9EF] text-[#18A957]"><Check className="size-3" /></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            </div>

            {videoPlaying && ytId && (
              <div className="fixed inset-0 z-[70] grid place-items-center bg-black/80 p-4" onClick={() => setVideoPlaying(false)}>
                <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-black shadow-2xl" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setVideoPlaying(false)} className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-black/60 text-white"><X className="size-5" /></button>
                  <div className="aspect-video"><iframe src={getYouTubeEmbedUrl(ytId) + '&autoplay=1'} title={`${product.name} заавар видео`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="size-full" /></div>
                </div>
              </div>
            )}

            {activeImage && (
              <div className="fixed inset-0 z-[70] grid place-items-center bg-black/80 p-4" onClick={() => setActiveImage(null)}>
                <button onClick={() => setActiveImage(null)} className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/15 text-white"><X className="size-5" /></button>
                <img src={activeImage} alt="Зааврын зураг" className="max-h-[88vh] max-w-full rounded-2xl" onClick={(e) => e.stopPropagation()} />
              </div>
            )}
          </div>
        ) : (
          <p className="p-10 text-center text-sm text-[#7187A2]">Бүтээгдэхүүн татаж чадсангүй. Дахин оролдоно уу.</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
