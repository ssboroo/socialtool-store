'use client'

import { useCallback, useEffect, useState } from 'react'
import { Grid3X3, List, PackageOpen, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  const [activeCat, setActiveCat] = useState('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured')

  useEffect(() => {
    const handler = (e: Event) => setActiveCat((e as CustomEvent).detail as string)
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

  return (
    <section id="products" className="px-4 pb-12 pt-4 sm:px-6 lg:px-8 lg:pb-16">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col gap-3 rounded-[20px] border border-[#DDE9F8] bg-white/88 p-3 shadow-[0_10px_35px_rgba(20,71,126,.06)] backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 lg:pb-0">
            <button
              onClick={() => setActiveCat('all')}
              className={`shrink-0 rounded-full px-5 py-2 text-[12px] font-bold transition ${activeCat === 'all' ? 'bg-[#1677FF] text-white shadow-[0_6px_16px_rgba(22,119,255,.23)]' : 'border border-[#D9E5F4] bg-white text-[#274867] hover:bg-[#F3F8FF]'}`}
            >
              Бүгд
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.slug)}
                className={`shrink-0 rounded-full px-4 py-2 text-[12px] font-semibold transition ${activeCat === c.slug ? 'bg-[#1677FF] text-white shadow-[0_6px_16px_rgba(22,119,255,.23)]' : 'border border-[#D9E5F4] bg-white text-[#274867] hover:bg-[#F3F8FF]'}`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#55718E]" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                className="h-10 min-w-[190px] appearance-none rounded-xl border border-[#D9E5F4] bg-white pl-9 pr-9 text-[12px] font-semibold text-[#274867] outline-none transition focus:border-[#1677FF]"
              >
                <option value="featured">Эрэмбэлэх: Шилдэг</option>
                <option value="rating">Эрэмбэлэх: Үнэлгээ</option>
                <option value="price-asc">Үнэ: Багаас их</option>
                <option value="price-desc">Үнэ: Ихээс бага</option>
              </select>
            </div>
            <button className="grid size-10 place-items-center rounded-xl bg-[#1677FF] text-white" aria-label="Grid харагдац"><Grid3X3 className="size-4" /></button>
            <button className="hidden size-10 place-items-center rounded-xl border border-[#D9E5F4] bg-white text-[#7890AA] sm:grid" aria-label="List харагдац"><List className="size-4" /></button>
          </div>
        </div>

        {query && (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-[#F4F8FE] px-4 py-2 text-xs text-[#55718E]">
            <span>Хайлтын үр дүн: <strong className="text-[#173A60]">“{query}”</strong> · {products.length} бүтээгдэхүүн</span>
            <button onClick={() => setQuery('')} className="font-semibold text-[#1677FF] hover:underline">Цэвэрлэх</button>
          </div>
        )}

        {loading ? (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 min-[1280px]:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => <div key={i} className="h-[405px] animate-pulse rounded-[18px] border border-[#DDE9F8] bg-white/70" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-[22px] border border-[#DDE9F8] bg-white py-16 text-center">
            <div className="grid size-14 place-items-center rounded-2xl bg-[#EAF3FF]"><PackageOpen className="size-7 text-[#1677FF]" /></div>
            <h3 className="mt-4 text-lg font-extrabold text-[#102A43]">Бүтээгдэхүүн олдсонгүй</h3>
            <p className="mt-1 text-sm text-[#7187A2]">Шүүлтүүр эсвэл хайлтаа өөрчилж үзээрэй.</p>
            <Button variant="outline" className="mt-4 rounded-xl" onClick={() => { setQuery(''); setActiveCat('all') }}>Шүүлтүүр цэвэрлэх</Button>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-4 min-[1280px]:grid-cols-6">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </section>
  )
}
