'use client'

import { useEffect, useState } from 'react'
import { Search, SlidersHorizontal, PackageOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProductCard, type Product } from './product-card'

interface Category {
  id: string
  name: string
  slug: string
  icon: string
}

export function FeaturedProducts({ categories, initialProducts }: { categories: Category[]; initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [loading, setLoading] = useState(false)
  const [activeCat, setActiveCat] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured')

  useEffect(() => {
    const handler = (e: Event) => {
      const slug = (e as CustomEvent<string>).detail
      setActiveCat(slug)
    }
    window.addEventListener('st-category', handler)
    try {
      const q = sessionStorage.getItem('st-search')
      if (q) {
        setQuery(q)
        sessionStorage.removeItem('st-search')
      }
    } catch {}
    return () => window.removeEventListener('st-category', handler)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (activeCat !== 'all') params.set('category', activeCat)
        if (query.trim()) params.set('q', query.trim())
        params.set('sort', sort)

        const res = await fetch(`/api/products?${params.toString()}`, {
          signal: controller.signal,
          cache: 'no-store',
        })
        if (!res.ok) return
        const data = (await res.json()) as Product[]
        setProducts(data)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 280)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [activeCat, query, sort])

  return (
    <section id="products" className="relative bg-gradient-to-b from-transparent to-[#EEF4FF]/40 py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D6E4FF] bg-white px-3 py-1 text-xs font-semibold text-[#1677FF] shadow-sm">
              <SlidersHorizontal className="size-3.5" /> Бүтээгдэхүүн
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#102A43] sm:text-4xl">
              Онцлох <span className="gradient-text">хэрэгслүүд</span>
            </h2>
            <p className="mt-2 text-[#5B7290]" aria-live="polite">
              {loading ? 'Хайж байна…' : `${products.length} хэрэгсэл — аюулгүй, шуурхай хүргэлттэй`}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] lg:min-w-[430px]">
            <label className="relative block">
              <span className="sr-only">Хэрэгсэл хайх</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5B7290]" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Хэрэгсэл хайх..."
                className="h-10 w-full rounded-xl border-[#D6E4FF] bg-white pl-9 shadow-sm focus-visible:border-[#1677FF]"
              />
            </label>
            <label>
              <span className="sr-only">Эрэмбэлэх</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                className="h-10 w-full rounded-xl border border-[#D6E4FF] bg-white px-3 text-sm text-[#102A43] shadow-sm focus:border-[#1677FF] focus:outline-none sm:w-auto"
              >
                <option value="featured">Онцлох</option>
                <option value="price-asc">Үнэ: Багаас их</option>
                <option value="price-desc">Үнэ: Ихээс бага</option>
                <option value="rating">Үнэлгээ</option>
              </select>
            </label>
          </div>
        </div>

        <div className="custom-scroll -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          <button
            type="button"
            aria-pressed={activeCat === 'all'}
            onClick={() => setActiveCat('all')}
            className={`h-9 shrink-0 rounded-full px-4 text-xs font-semibold transition-all ${
              activeCat === 'all'
                ? 'bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white shadow-premium'
                : 'border border-[#D6E4FF] bg-white text-[#102A43] hover:border-[#1677FF]/40 hover:bg-[#E8F1FF]'
            }`}
          >
            Бүгд
          </button>
          {categories.map((c) => (
            <button
              type="button"
              key={c.id}
              aria-pressed={activeCat === c.slug}
              onClick={() => setActiveCat(c.slug)}
              className={`h-9 shrink-0 rounded-full px-4 text-xs font-semibold transition-all ${
                activeCat === c.slug
                  ? 'bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white shadow-premium'
                  : 'border border-[#D6E4FF] bg-white text-[#102A43] hover:border-[#1677FF]/40 hover:bg-[#E8F1FF]'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4" aria-label="Бүтээгдэхүүн ачаалж байна">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[350px] animate-pulse rounded-2xl border border-[#D6E4FF] bg-white/70" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#D6E4FF] bg-white/60 py-16 text-center">
            <div className="grid size-16 place-items-center rounded-2xl bg-[#E8F1FF]">
              <PackageOpen className="size-8 text-[#1677FF]" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-[#102A43]">Хэрэгсэл олдсонгүй</h3>
            <p className="mt-1 text-sm text-[#5B7290]">Өөр үгээр хайх эсвэл шүүлтүүрээ цэвэрлээрэй</p>
            <Button
              variant="outline"
              className="mt-4 rounded-full border-[#D6E4FF] bg-white"
              onClick={() => {
                setQuery('')
                setActiveCat('all')
              }}
            >
              Шүүлтүүр цэвэрлэх
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
