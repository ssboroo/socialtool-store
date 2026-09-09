'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, SlidersHorizontal, PackageOpen, Loader2 } from 'lucide-react'
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

  // listen to category events from categories section
  useEffect(() => {
    const handler = (e: Event) => {
      const slug = (e as CustomEvent).detail as string
      setActiveCat(slug)
    }
    window.addEventListener('st-category', handler)
    // restore search query from sessionStorage (set by header search)
    try {
      const q = sessionStorage.getItem('st-search')
      if (q) {
        setQuery(q)
        sessionStorage.removeItem('st-search')
      }
    } catch {}
    return () => window.removeEventListener('st-category', handler)
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeCat !== 'all') params.set('category', activeCat)
      if (query.trim()) params.set('q', query.trim())
      params.set('sort', sort)
      const res = await fetch(`/api/products?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data)
      }
    } catch {
      // keep existing
    } finally {
      setLoading(false)
    }
  }, [activeCat, query, sort])

  // debounce fetch
  useEffect(() => {
    const t = setTimeout(fetchProducts, 250)
    return () => clearTimeout(t)
     
  }, [activeCat, query, sort])

  return (
    <section id="products" className="relative py-16 lg:py-20 bg-gradient-to-b from-transparent to-[#EEF4FF]/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D6E4FF] bg-white px-3 py-1 text-xs font-semibold text-[#1677FF]">
              <SlidersHorizontal className="size-3.5" /> Бүтээгдэхүүн
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#102A43]">
              Онцлох <span className="gradient-text">хэрэгслүүд</span>
            </h2>
            <p className="mt-2 text-[#5B7290]">
              {products.length} хэрэгсэл — аюулгүй, шуурхай хүргэлттэй
            </p>
          </div>

          {/* search + sort */}
          <div className="flex flex-col sm:flex-row gap-2 lg:w-auto">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#5B7290]" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Хэрэгсэл хайх..."
                className="h-10 w-full sm:w-56 pl-9 rounded-xl bg-white border-[#D6E4FF]"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="h-10 rounded-xl border border-[#D6E4FF] bg-white px-3 text-sm text-[#102A43] focus:border-[#1677FF] focus:outline-none"
            >
              <option value="featured">Онцлох</option>
              <option value="price-asc">Үнэ: Багаас их</option>
              <option value="price-desc">Үнэ: Ихээс бага</option>
              <option value="rating">Үнэлгээ</option>
            </select>
          </div>
        </div>

        {/* category chips */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCat('all')}
            className={`h-8 rounded-full px-4 text-xs font-semibold transition-colors ${
              activeCat === 'all'
                ? 'bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white shadow-premium'
                : 'bg-white border border-[#D6E4FF] text-[#102A43] hover:bg-[#E8F1FF]'
            }`}
          >
            Бүгд
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.slug)}
              className={`h-8 rounded-full px-4 text-xs font-semibold transition-colors ${
                activeCat === c.slug
                  ? 'bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white shadow-premium'
                  : 'bg-white border border-[#D6E4FF] text-[#102A43] hover:bg-[#E8F1FF]'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* grid */}
        {loading ? (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[320px] rounded-2xl border border-[#D6E4FF] bg-white/60 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="mt-12 flex flex-col items-center justify-center py-16 text-center">
            <div className="grid size-16 place-items-center rounded-2xl bg-[#E8F1FF]">
              <PackageOpen className="size-8 text-[#1677FF]" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-[#102A43]">Хэрэгсэл олдсонгүй</h3>
            <p className="mt-1 text-sm text-[#5B7290]">Өөр үгээр хайж үзээрэй</p>
            <Button
              variant="outline"
              className="mt-4 rounded-full border-[#D6E4FF]"
              onClick={() => {
                setQuery('')
                setActiveCat('all')
              }}
            >
              Шүүлтүүр цэвэрлэх
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
