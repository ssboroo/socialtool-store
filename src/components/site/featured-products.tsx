'use client'

import { useEffect, useState } from 'react'
import { Search, ChevronDown, PackageOpen, CircleAlert, House, Headphones, ArrowRight, Truck, ShieldCheck, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProductCard, type Product } from './product-card'

import { CategoryIcon } from './category-icon'
import { Hero, StoreIntroduction } from './hero'

interface Category {
  id: string
  name: string
  slug: string
  icon: string
}

export function FeaturedProducts({ categories, initialProducts, settings }: { categories: Category[]; initialProducts: Product[]; settings?: Record<string, string> }) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [retry, setRetry] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 8
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
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydrate browser-owned storage or imperative UI state after mount; SSR cannot read this source.
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
      setFailed(false)
      try {
        const params = new URLSearchParams()
        if (activeCat !== 'all') params.set('category', activeCat)
        if (query.trim()) params.set('q', query.trim())
        params.set('sort', sort)

        const res = await fetch(`/api/products?${params.toString()}`, {
          signal: controller.signal,
          cache: 'no-store',
        })
        if (!res.ok) throw new Error('Unable to load products')
        const data = (await res.json()) as Product[]
        if (!controller.signal.aborted) { setProducts(data); setPage(1) }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        if (!controller.signal.aborted) setFailed(true)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 280)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [activeCat, query, sort, retry])


  const categoryName = activeCat === 'all' ? 'Бүх хэрэгсэл' : categories.find(c => c.slug === activeCat)?.name || 'Бүх хэрэгсэл'
  const filterCategories = [{ id: 'all', slug: 'all', name: 'Бүх хэрэгсэл' }, ...categories.filter(c => c.slug !== 'all')]
  const gridClass = 'catalog-grid'
  const pageCount = Math.max(1, Math.ceil(products.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const start = (currentPage - 1) * pageSize
  const pageNumbers = Array.from({ length: pageCount }, (_, i) => i + 1).filter(n => n === 1 || n === pageCount || Math.abs(n - currentPage) <= 1)
  return <div className="catalog-section">
    <div className="catalog-layout">
      <aside className="catalog-sidebar" aria-label="Бүтээгдэхүүний ангилал">
        <div className="catalog-side-panel">
          <a href="#top" className="catalog-home"><House size={19}/>Нүүр</a>
          <details className="catalog-mobile-picker">
            <summary><CategoryIcon name={categoryName} slug={activeCat}/><span><small>Ангилал сонгох</small><strong>{categoryName}</strong></span><ChevronDown className="size-4"/></summary>
            <div className="catalog-mobile-options">
              {filterCategories.map(c=><button type="button" key={c.id} aria-pressed={activeCat===c.slug} onClick={e=>{setActiveCat(c.slug);const details=e.currentTarget.closest('details');if(details){details.open=false;details.querySelector('summary')?.focus({preventScroll:true})}}}><CategoryIcon name={c.name} slug={c.slug}/><span>{c.name}</span></button>)}
            </div>
          </details>
          <nav className="catalog-category-list">
            {filterCategories.map(c=><button type="button" key={c.id} aria-pressed={activeCat===c.slug} onClick={()=>setActiveCat(c.slug)}>
              <CategoryIcon name={c.name} slug={c.slug}/><span>{c.name}</span>
            </button>)}
          </nav>
        </div>
        <StoreIntroduction settings={settings}/>
        <a href="#faq" className="catalog-support-note"><Headphones/><span><strong>Танд тусалъя</strong><small>Асуултынхаа хариуг<br/>эндээс олоорой.</small></span><span className="catalog-support-link">Тусламж авах <ArrowRight size={13}/></span></a>
      </aside>
      <div className="catalog-results">
        <Hero products={initialProducts} settings={settings} productCount={initialProducts.filter(p=>p.available).length} categoryCount={filterCategories.length-1}/>
        <nav id="categories" className="catalog-chips" aria-label="Ангиллаар шүүх">
          {filterCategories.map(c=><button key={c.id} type="button" aria-pressed={activeCat===c.slug} onClick={()=>setActiveCat(c.slug)}><CategoryIcon name={c.name} slug={c.slug}/><span>{c.name}</span></button>)}
        </nav>
        <section id="products" aria-label="Бүтээгдэхүүнүүд">
        <div className="catalog-toolbar">
          <div><h2>{activeCat==='all'&&!query&&sort==='featured'?'Онцлох бүтээгдэхүүн':categoryName}</h2><p aria-live="polite">{loading?'Хайж байна…':failed?'Мэдээлэл шинэчлэгдсэнгүй':products.length+' бүтээгдэхүүн'}</p></div>
          <div className="catalog-search">
            <label className="relative"><span className="sr-only">Хэрэгсэл хайх</span><Search className="absolute left-3 top-3 size-4 text-muted-foreground"/><Input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Нэрээр хайх…" className="h-11 pl-9 bg-card"/></label>
            <label><span className="sr-only">Эрэмбэлэх</span><select value={sort} onChange={e=>setSort(e.target.value as typeof sort)}><option value="featured">Онцлох эхэнд</option><option value="price-asc">Үнэ: багаас их</option><option value="price-desc">Үнэ: ихээс бага</option><option value="rating">Үнэлгээгээр</option></select></label>
          </div>
        </div>
        {failed && <div className="catalog-error" role="alert"><CircleAlert className="mx-auto size-8"/><h3>Хэрэгслүүдийг ачаалж чадсангүй</h3><p>Холболтоо шалгаад дахин оролдоорой.</p><Button variant="outline" onClick={() => setRetry(value => value + 1)}>Дахин оролдох</Button></div>}
        <div aria-busy={loading}>
          {loading && products.length===0 ? <div className={gridClass} aria-hidden="true">{Array.from({length: 8}, (_, i) => <div key={i} className="catalog-skeleton"><div className="catalog-skeleton-art"/><div className="catalog-skeleton-line"/><div className="catalog-skeleton-line"/></div>)}</div>
          : failed ? null : products.length===0?<div className="catalog-empty"><PackageOpen className="mx-auto size-10"/><h3>Хэрэгсэл олдсонгүй</h3><p>Өөр үгээр хайх эсвэл ангиллаа солиорой.</p><Button variant="outline" onClick={()=>{setQuery('');setActiveCat('all')}}>Шүүлтүүр цэвэрлэх</Button></div>
          :<><div className={gridClass}>{products.slice(start,start + pageSize).map(p=><ProductCard key={p.id} product={p}/>)}</div><div className="catalog-pagination-wrap">
            <p role="status">{start + 1}–{Math.min(start + pageSize, products.length)} / {products.length} бүтээгдэхүүн</p>
            {pageCount > 1 && <nav className="catalog-pagination" aria-label="Бүтээгдэхүүний хуудас">
              <Button variant="outline" disabled={loading || currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label="Өмнөх хуудас">‹</Button>
              {pageNumbers.map((n, i) => <span className="catalog-page-item" key={n}>
                {i > 0 && n - pageNumbers[i - 1] > 1 && <span className="catalog-page-gap" aria-hidden="true">…</span>}
                <Button variant={n === currentPage ? 'default' : 'outline'} disabled={loading} aria-label={n + '-р хуудас'} aria-current={n === currentPage ? 'page' : undefined} onClick={() => setPage(n)}>{n}</Button>
              </span>)}
              <Button variant="outline" disabled={loading || currentPage === pageCount} onClick={() => setPage(currentPage + 1)} aria-label="Дараах хуудас">›</Button>
            </nav>}
          </div></>}
        </div>
        </section>
        <div className="mobile-store-introduction"><StoreIntroduction settings={settings} mobile/></div>
        <div className="catalog-service-strip">
          <a href="#how"><Truck/><span><strong>Шуурхай хүргэлт</strong><small>Дижитал захиалга</small></span></a>
          <a href="#how"><Wallet/><span><strong>Аюулгүй төлбөр</strong><small>QPay-аар төлөх</small></span></a>
          <a href="#faq"><ShieldCheck/><span><strong>Бүтээгдэхүүний баталгаа</strong><small>Нөхцөлийг дэлгэрэнгүй үзэх</small></span></a>
          <a href="#categories" className="catalog-service-promo"><strong>Илүү их хэрэгсэл.<br/>Илүү их боломж.</strong><ArrowRight/></a>
        </div>

      </div>
    </div>
  </div>
}
