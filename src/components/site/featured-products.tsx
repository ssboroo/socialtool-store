'use client'

import { useEffect, useState } from 'react'
import { Search, ChevronDown, PackageOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProductCard, type Product } from './product-card'

import { CategoryIcon } from './category-icon'

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
    const categoryHandler = (e: Event) => {
      const slug = (e as CustomEvent<string>).detail
      setActiveCat(slug)
    }
    const searchHandler = (e: Event) => {
      const value = (e as CustomEvent<string>).detail || ''
      setQuery(value)
    }

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
        if (!controller.signal.aborted) setProducts(data)
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


  const categoryName = activeCat === 'all' ? 'Бүх хэрэгсэл' : categories.find(c => c.slug === activeCat)?.name || 'Бүх хэрэгсэл'
  const gridClass = 'catalog-grid'
  return <section id="products" className="catalog-section">
    <div className="catalog-layout">
      <aside id="categories" className="catalog-sidebar" aria-label="Бүтээгдэхүүний ангилал">
        <div className="catalog-side-panel">
          <h2>Ангилал</h2>
          <details className="catalog-mobile-picker">
            <summary><CategoryIcon name={categoryName} slug={activeCat}/><span><small>Ангилал сонгох</small><strong>{categoryName}</strong></span><ChevronDown className="size-4"/></summary>
            <div className="catalog-mobile-options">
              {[{id:'all',slug:'all',name:'Бүх хэрэгсэл'},...categories].map(c=><button type="button" key={c.id} aria-pressed={activeCat===c.slug} onClick={e=>{setActiveCat(c.slug);const details=e.currentTarget.closest('details');if(details){details.open=false;details.querySelector('summary')?.focus({preventScroll:true})}}}><CategoryIcon name={c.name} slug={c.slug}/><span>{c.name}</span></button>)}
            </div>
          </details>
          <nav className="catalog-category-list">
            {[{id:'all',slug:'all',name:'Бүх хэрэгсэл'},...categories].map(c=><button type="button" key={c.id} aria-pressed={activeCat===c.slug} onClick={()=>setActiveCat(c.slug)}>
              <CategoryIcon name={c.name} slug={c.slug}/><span>{c.name}</span>
            </button>)}
          </nav>
        </div>
        <div className="catalog-side-note"><span>SOCIALTOOL.STORE</span><p>Илүү бүтээмжтэй.<br/>Илүү олон боломж.</p><span>Таны дижитал туслагч</span></div>
      </aside>
      <div className="catalog-results">
        <div className="catalog-toolbar">
          <div><span className="catalog-eyebrow">ДИЖИТАЛ ХЭРЭГСЛҮҮД</span><h2>{categoryName}</h2><p aria-live="polite">{loading?'Хайж байна…':products.length+' бүтээгдэхүүн'}</p></div>
          <div className="catalog-search">
            <label className="relative"><span className="sr-only">Хэрэгсэл хайх</span><Search className="absolute left-3 top-3 size-4 text-muted-foreground"/><Input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Нэрээр хайх…" className="h-11 pl-9 bg-card"/></label>
            <label><span className="sr-only">Эрэмбэлэх</span><select value={sort} onChange={e=>setSort(e.target.value as typeof sort)}><option value="featured">Онцлох эхэнд</option><option value="price-asc">Үнэ: багаас их</option><option value="price-desc">Үнэ: ихээс бага</option><option value="rating">Үнэлгээгээр</option></select></label>
          </div>
        </div>
        {products.length===0?<div className="catalog-empty"><PackageOpen className="mx-auto size-10"/><h3>Хэрэгсэл олдсонгүй</h3><p>Өөр үгээр хайх эсвэл ангиллаа солиорой.</p><Button variant="outline" onClick={()=>{setQuery('');setActiveCat('all')}}>Шүүлтүүр цэвэрлэх</Button></div>
        :<div className={gridClass}>{products.map(p=><ProductCard key={p.id} product={p}/>)}</div>}
      </div>
    </div>
  </section>
}
