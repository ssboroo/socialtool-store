'use client'

import { useCallback, useMemo, useState, useEffect } from 'react'
import {
  Boxes,
  Check,
  ChevronRight,
  Facebook,
  Grid3X3,
  Headphones,
  Heart,
  Instagram,
  List,
  MessageCircle,
  Music2,
  PackageOpen,
  Send,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Star,
  Youtube,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductCard, type Product } from './product-card'
import { ProductImage } from './product-illustration'
import { ProductDescription } from './product-description'
import { LicenseSelector } from './license-selector'
import { licenseOptions, licensePrice, type LicenseTerm } from '@/lib/license'
import { formatTugrik } from '@/lib/format'
import { parseImageList } from '@/lib/media'
import { useCartStore } from '@/store/cart'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
  slug: string
  icon: string
}

const platformRows = [
  { label: 'Facebook', keyword: 'facebook', Icon: Facebook },
  { label: 'Instagram', keyword: 'instagram', Icon: Instagram },
  { label: 'TikTok', keyword: 'tiktok', Icon: Music2 },
  { label: 'YouTube', keyword: 'youtube', Icon: Youtube },
  { label: 'X (Twitter)', keyword: 'twitter', Icon: Boxes },
  { label: 'WhatsApp', keyword: 'whatsapp', Icon: MessageCircle },
  { label: 'Telegram', keyword: 'telegram', Icon: Send },
  { label: 'Google / AI', keyword: 'google', Icon: Sparkles },
  { label: 'Autodesk', keyword: 'autodesk', Icon: Boxes },
]

function productContains(product: Product, keyword: string) {
  return `${product.name} ${product.shortDesc} ${product.category}`.toLowerCase().includes(keyword)
}

export function FeaturedProducts({ categories, initialProducts }: { categories: Category[]; initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [loading, setLoading] = useState(false)
  const [activeCat, setActiveCat] = useState('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured')
  const [selectedId, setSelectedId] = useState(initialProducts[0]?.id || '')
  const [detailDuration, setDetailDuration] = useState<LicenseTerm>('')
  const [qty, setQty] = useState(1)
  const priceCeiling = Math.max(500000, ...initialProducts.map((p) => p.price || 0))
  const [priceLimit, setPriceLimit] = useState(priceCeiling)
  const add = useCartStore((s) => s.add)

  useEffect(() => {
    const categoryHandler = (e: Event) => setActiveCat((e as CustomEvent).detail as string)
    const searchHandler = (e: Event) => setQuery((e as CustomEvent).detail as string)
    window.addEventListener('st-category', categoryHandler)
    window.addEventListener('st-search', searchHandler)
    try {
      const q = sessionStorage.getItem('st-search')
      if (q) {
        setQuery(q)
        sessionStorage.removeItem('st-search')
      }
    } catch {}
    return () => {
      window.removeEventListener('st-category', categoryHandler)
      window.removeEventListener('st-search', searchHandler)
    }
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeCat !== 'all') params.set('category', activeCat)
      if (query.trim()) params.set('q', query.trim())
      params.set('sort', sort)
      const res = await fetch(`/api/products?${params.toString()}`)
      if (res.ok) setProducts(await res.json())
    } finally {
      setLoading(false)
    }
  }, [activeCat, query, sort])

  useEffect(() => {
    const t = setTimeout(fetchProducts, 220)
    return () => clearTimeout(t)
  }, [fetchProducts])

  const visibleProducts = useMemo(
    () => products.filter((product) => product.price <= priceLimit),
    [products, priceLimit]
  )

  const selected = useMemo(
    () => visibleProducts.find((p) => p.id === selectedId) || visibleProducts[0] || initialProducts.find((p) => p.id === selectedId) || initialProducts[0],
    [visibleProducts, selectedId, initialProducts]
  )

  const detailOptions = licenseOptions(selected?.duration)
  const selectedDuration = detailOptions.includes(detailDuration) ? detailDuration : detailOptions[0] || ''
  const detailFeatures = selected?.features?.split(';').map((f) => f.trim()).filter(Boolean) || []
  const gallery = selected ? [selected.image, ...parseImageList(selected.instructionImages)].filter(Boolean) as string[] : []

  const chooseProduct = (product: Product) => {
    setSelectedId(product.id)
    setDetailDuration('')
    setQty(1)
    window.setTimeout(() => document.querySelector('#product-detail')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 30)
  }

  const addSelected = () => {
    if (!selected) return
    add({
      id: selected.id,
      duration: selectedDuration,
      name: selected.name,
      price: licensePrice(selected, selectedDuration),
      icon: selected.icon,
      category: selected.category,
    }, qty)
    toast.success(`${selected.name} сагсанд нэмэгдлээ`)
  }

  return (
    <section id="products" className="px-4 pb-12 pt-4 sm:px-6 lg:px-8 lg:pb-16">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-4 xl:grid-cols-[214px_minmax(0,1fr)]">
          <aside className="hidden self-start overflow-hidden rounded-[16px] border border-[#DCE7F4] bg-white shadow-[0_6px_24px_rgba(30,78,130,.055)] xl:block">
            <button
              onClick={() => setActiveCat('all')}
              className="flex h-11 w-full items-center justify-between bg-[#116EF0] px-4 text-left text-[12px] font-extrabold text-white"
            >
              <span className="flex items-center gap-2"><List className="size-4" /> Бүх категория</span>
              <ChevronRight className="size-4" />
            </button>

            <div className="border-b border-[#EDF3F9] py-1.5">
              {categories.slice(0, 7).map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCat(category.slug)}
                  className={`flex w-full items-center justify-between px-4 py-2 text-left text-[11px] font-semibold transition ${activeCat === category.slug ? 'bg-[#F0F6FF] text-[#116EF0]' : 'text-[#345371] hover:bg-[#F7FAFE]'}`}
                >
                  <span className="flex min-w-0 items-center gap-2"><Boxes className="size-3.5 shrink-0" /><span className="truncate">{category.name}</span></span>
                  <ChevronRight className="size-3.5 shrink-0" />
                </button>
              ))}
            </div>

            <div className="border-b border-[#EDF3F9] px-4 py-4">
              <p className="text-[11px] font-extrabold text-[#173A60]">Үнийн хязгаар</p>
              <input
                type="range"
                min={0}
                max={priceCeiling}
                step={1000}
                value={priceLimit}
                onChange={(e) => setPriceLimit(Number(e.target.value))}
                className="mt-3 w-full accent-[#1677FF]"
                aria-label="Үнийн дээд хязгаар"
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <span className="rounded-lg border border-[#DCE7F4] bg-[#FBFDFF] px-2 py-2 text-center text-[10px] font-bold text-[#617A96]">0 ₮</span>
                <span className="rounded-lg border border-[#DCE7F4] bg-[#FBFDFF] px-2 py-2 text-center text-[10px] font-bold text-[#617A96]">{formatTugrik(priceLimit)}</span>
              </div>
            </div>

            <div className="border-b border-[#EDF3F9] px-4 py-4">
              <p className="text-[11px] font-extrabold text-[#173A60]">Платформ</p>
              <div className="mt-2.5 space-y-2">
                {platformRows.map(({ label, keyword, Icon }) => {
                  const count = initialProducts.filter((p) => productContains(p, keyword)).length
                  return (
                    <label key={label} className="flex cursor-pointer items-center gap-2 text-[10px] font-semibold text-[#4C6986]">
                      <input type="checkbox" className="size-3 rounded border-[#C9D9EA] accent-[#1677FF]" />
                      <Icon className="size-3.5 text-[#1677FF]" />
                      <span className="min-w-0 flex-1 truncate">{label}</span>
                      <span className="rounded bg-[#F1F5FA] px-1.5 py-0.5 text-[9px] text-[#7890AA]">{count}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="px-4 py-4">
              <p className="text-[11px] font-extrabold text-[#173A60]">Бүтээгдэхүүний төрөл</p>
              <div className="mt-2.5 space-y-2 text-[10px] font-semibold text-[#4C6986]">
                {['Аккаунт', 'Лиценз', 'Сургалт'].map((label, i) => (
                  <label key={label} className="flex cursor-pointer items-center gap-2">
                    <input type="checkbox" className="size-3 rounded border-[#C9D9EA] accent-[#1677FF]" />
                    <span className="flex-1">{label}</span>
                    <span className="rounded bg-[#F1F5FA] px-1.5 py-0.5 text-[9px] text-[#7890AA]">{Math.max(1, Math.round(initialProducts.length / (i + 2)))}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-[26px] font-black tracking-[-0.035em] text-[#102A43]">Бүтээгдэхүүн</h2>
                <p className="mt-0.5 text-[11px] font-medium text-[#7890AA]">Нийт {visibleProducts.length} бүтээгдэхүүн</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#55718E]" />
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as typeof sort)}
                    className="h-10 min-w-[220px] appearance-none rounded-xl border border-[#D9E5F4] bg-white pl-9 pr-9 text-[11px] font-semibold text-[#274867] outline-none focus:border-[#1677FF]"
                  >
                    <option value="featured">Эрэмбэлэх: Хамгийн их борлуулалт</option>
                    <option value="rating">Эрэмбэлэх: Үнэлгээ</option>
                    <option value="price-asc">Үнэ: Багаас их</option>
                    <option value="price-desc">Үнэ: Ихээс бага</option>
                  </select>
                </div>
                <button className="grid size-10 place-items-center rounded-xl bg-[#1677FF] text-white" aria-label="Grid харагдац"><Grid3X3 className="size-4" /></button>
              </div>
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 xl:hidden">
              <button onClick={() => setActiveCat('all')} className={`shrink-0 rounded-full px-4 py-2 text-[11px] font-bold ${activeCat === 'all' ? 'bg-[#1677FF] text-white' : 'border border-[#D9E5F4] bg-white text-[#274867]'}`}>Бүгд</button>
              {categories.map((c) => <button key={c.id} onClick={() => setActiveCat(c.slug)} className={`shrink-0 rounded-full px-4 py-2 text-[11px] font-bold ${activeCat === c.slug ? 'bg-[#1677FF] text-white' : 'border border-[#D9E5F4] bg-white text-[#274867]'}`}>{c.name}</button>)}
            </div>

            {query && (
              <div className="mt-3 flex items-center justify-between rounded-xl bg-[#F4F8FE] px-4 py-2 text-xs text-[#55718E]">
                <span>Хайлтын үр дүн: <strong className="text-[#173A60]">“{query}”</strong> · {visibleProducts.length}</span>
                <button onClick={() => setQuery('')} className="font-semibold text-[#1677FF] hover:underline">Цэвэрлэх</button>
              </div>
            )}

            {loading ? (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 min-[1280px]:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-[392px] animate-pulse rounded-[16px] border border-[#DDE9F8] bg-white/70" />)}
              </div>
            ) : visibleProducts.length === 0 ? (
              <div className="mt-6 flex flex-col items-center justify-center rounded-[18px] border border-[#DDE9F8] bg-white py-16 text-center">
                <div className="grid size-14 place-items-center rounded-2xl bg-[#EAF3FF]"><PackageOpen className="size-7 text-[#1677FF]" /></div>
                <h3 className="mt-4 text-lg font-extrabold text-[#102A43]">Бүтээгдэхүүн олдсонгүй</h3>
                <p className="mt-1 text-sm text-[#7187A2]">Шүүлтүүр эсвэл хайлтаа өөрчилж үзээрэй.</p>
                <Button variant="outline" className="mt-4 rounded-xl" onClick={() => { setQuery(''); setActiveCat('all'); setPriceLimit(priceCeiling) }}>Шүүлтүүр цэвэрлэх</Button>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3 min-[1280px]:grid-cols-6">
                {visibleProducts.slice(0, 12).map((p) => <ProductCard key={p.id} product={p} onSelect={chooseProduct} />)}
              </div>
            )}

            {selected && (
              <div id="product-detail" className="mt-5 overflow-hidden rounded-[18px] border border-[#DCE7F4] bg-white shadow-[0_10px_34px_rgba(31,81,135,.07)]">
                <div className="grid gap-0 lg:grid-cols-[280px_minmax(0,.9fr)_minmax(0,1.2fr)]">
                  <div className="border-b border-[#EDF3F9] p-4 lg:border-b-0 lg:border-r">
                    <div className="relative overflow-hidden rounded-[14px] bg-[#EEF6FF]">
                      <span className="absolute right-2.5 top-2.5 z-10 rounded-full border border-[#BDD8FA] bg-white/95 px-2 py-1 text-[9px] font-bold text-[#1677FF]">{selected.category}</span>
                      <ProductImage image={selected.image} icon={selected.icon} alt={selected.name} className="aspect-square w-full rounded-none" />
                    </div>
                    <div className="mt-2.5 grid grid-cols-4 gap-2">
                      {[0, 1, 2, 3].map((index) => {
                        const src = gallery[index]
                        return src ? (
                          <div key={`${src}-${index}`} className="aspect-square overflow-hidden rounded-[9px] border border-[#DCE7F4] bg-[#F7FAFE]"><img src={src} alt={`${selected.name} зураг ${index + 1}`} className="size-full object-cover" /></div>
                        ) : (
                          <div key={index} className="grid aspect-square place-items-center rounded-[9px] border border-[#DCE7F4] bg-[#F3F8FF] text-[#1677FF]"><Boxes className="size-5" /></div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="border-b border-[#EDF3F9] p-5 lg:border-b-0 lg:border-r">
                    <p className="text-[9.5px] font-semibold text-[#7890AA]">Нүүр / {selected.category} / {selected.name}</p>
                    <h3 className="mt-2 text-[24px] font-black tracking-[-0.03em] text-[#102A43]">{selected.name}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-0.5">{[0, 1, 2, 3, 4].map((i) => <Star key={i} className={`size-3.5 ${i < Math.round(selected.rating) ? 'fill-[#FFAA00] text-[#FFAA00]' : 'fill-[#DFE8F2] text-[#DFE8F2]'}`} />)}</div>
                      <span className="text-[10px] font-medium text-[#7187A2]">{selected.rating.toFixed(1)} ({selected.reviewCount} сэтгэгдэл)</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#16A34A]"><Check className="size-3.5" /> Баталгаатай</span>
                    </div>
                    <p className="mt-4 text-[12px] font-medium leading-5 text-[#5E7691]">{selected.shortDesc}</p>

                    <div className="mt-5">
                      <span className="text-[10px] font-bold text-[#7187A2]">Үнэ</span>
                      <div className="mt-1 flex items-end gap-2"><span className="text-[28px] font-black tracking-[-0.04em] text-[#102A43]">{formatTugrik(licensePrice(selected, selectedDuration))}</span>{selected.oldPrice ? <span className="pb-1 text-xs text-[#8AA0B8] line-through">{formatTugrik(selected.oldPrice)}</span> : null}</div>
                    </div>

                    <LicenseSelector value={selectedDuration} onChange={setDetailDuration} options={detailOptions} />

                    <div className="mt-4 flex items-center gap-2">
                      <div className="inline-flex h-10 items-center rounded-[10px] border border-[#D9E5F4] bg-white">
                        <button onClick={() => setQty((v) => Math.max(1, v - 1))} className="grid size-9 place-items-center text-[#58718F]">−</button>
                        <span className="min-w-7 text-center text-xs font-black text-[#102A43]">{qty}</span>
                        <button onClick={() => setQty((v) => v + 1)} className="grid size-9 place-items-center text-[#58718F]">+</button>
                      </div>
                      <Button onClick={addSelected} className="h-10 flex-1 rounded-[10px] bg-[#116EF0] text-[11px] font-bold text-white hover:bg-[#0866D9]"><ShoppingCart className="size-4" /> Сагсанд нэмэх</Button>
                      <button className="grid size-10 place-items-center rounded-[10px] border border-[#D9E5F4] text-[#365675] hover:bg-[#F5F9FF]" aria-label="Хадгалах"><Heart className="size-4" /></button>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#EEF3F9] pt-4">
                      {[[Zap, 'Шуурхай хүргэлт'], [ShieldCheck, '100% Найдвартай'], [Headphones, '24/7 Дэмжлэг']].map(([Icon, label]) => (
                        <div key={String(label)} className="text-center"><Icon className="mx-auto size-4 text-[#1677FF]" /><p className="mt-1 text-[8.5px] font-extrabold text-[#365675]">{String(label)}</p></div>
                      ))}
                    </div>
                  </div>

                  <div className="min-w-0 p-5">
                    <div className="flex gap-1 overflow-x-auto border-b border-[#E9F0F8] text-[9.5px] font-bold text-[#617A96]">
                      <span className="shrink-0 border-b-2 border-[#1677FF] px-2 pb-3 text-[#1677FF]">Тайлбар</span>
                      <span className="shrink-0 px-2 pb-3">Онцлог</span>
                      <span className="shrink-0 px-2 pb-3">Системийн шаардлага</span>
                      <span className="shrink-0 px-2 pb-3">Сэтгэгдэл ({selected.reviewCount})</span>
                    </div>
                    <h4 className="mt-4 text-[15px] font-extrabold text-[#102A43]">Бүтээгдэхүүний тайлбар</h4>
                    <div className="mt-1 max-h-[155px] overflow-y-auto pr-1 custom-scroll"><ProductDescription text={selected.description} /></div>

                    <div className="mt-4 border-t border-[#EEF3F9] pt-4">
                      <h4 className="text-[13px] font-extrabold text-[#102A43]">Үндсэн боломжууд</h4>
                      <ul className="mt-2.5 space-y-1.5">
                        {(detailFeatures.length ? detailFeatures : ['Хурдан, ойлгомжтой ашиглалт', 'Аюулгүй төлбөр ба баталгаат үйлчилгээ', 'Тогтмол шинэчлэлт, хэрэглэгчийн дэмжлэг']).slice(0, 7).map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-[10.5px] font-medium leading-4 text-[#5E7691]"><span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-[#E9F9EF] text-[#18A957]"><Check className="size-3" /></span>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
