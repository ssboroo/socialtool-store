'use client'
import { useEffect, useState, useMemo, useRef, useSyncExternalStore } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { ArrowRight, Check, Grid2X2, Heart, Headphones, List, PackageOpen, ShoppingCart, SlidersHorizontal, Star } from 'lucide-react'
import { ProductCard, type Product } from './product-card'
import { ProductImage } from './product-illustration'
import { ProductDescription } from './product-description'
import { LicenseSelector } from './license-selector'
import { licenseOptions, licensePrice } from '@/lib/license'
import { formatTugrik } from '@/lib/format'
import { parseImageList } from '@/lib/media'
import { useCartStore } from '@/store/cart'
import { toast } from 'sonner'

function savedSnapshot(){try{return localStorage.getItem('st-saved-products')||'[]'}catch{return '[]'}}
function subscribeSaved(notify:()=>void){window.addEventListener('storage',notify);window.addEventListener('st-saved-products',notify);return()=>{window.removeEventListener('storage',notify);window.removeEventListener('st-saved-products',notify)}}
interface Category { id:string; name:string; slug:string; icon:string }
export function FeaturedProducts({categories,initialProducts}:{categories:Category[];initialProducts:Product[]}){
  const [products,setProducts]=useState(initialProducts)
  const [category,setCategory]=useState('all')
  const [query,setQuery]=useState('')
  const [sort,setSort]=useState('featured')
  const [view,setView]=useState<'grid'|'list'>('grid')
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const [selected,setSelected]=useState<Product|null>(null)
  const detailTrigger=useRef<HTMLElement|null>(null)
  const [onlySaved,setOnlySaved]=useState(false)
  const rawSaved=useSyncExternalStore(subscribeSaved,savedSnapshot,()=> '[]')
  const saved=useMemo<string[]>(()=>{try{const value=JSON.parse(rawSaved);return Array.isArray(value)?value.filter(v=>typeof v==='string'):[]}catch{return []}},[rawSaved])
  useEffect(()=>{
    const search=(e:Event)=>setQuery(String((e as CustomEvent).detail||''))
    const cat=(e:Event)=>setCategory(String((e as CustomEvent).detail||'all'))
    const open=(e:Event)=>{const p=initialProducts.find(p=>p.id===(e as CustomEvent).detail);if(p){detailTrigger.current=document.activeElement as HTMLElement;setSelected(p)}}
    window.addEventListener('st-product',open)
    window.addEventListener('st-search',search);window.addEventListener('st-category',cat)
    return()=>{window.removeEventListener('st-search',search);window.removeEventListener('st-category',cat);window.removeEventListener('st-product',open)}
  },[initialProducts])
  useEffect(()=>{
    const abort=new AbortController()
    const timer=setTimeout(async()=>{
      setLoading(true);setError('')
      try{
        const params=new URLSearchParams({sort});if(category!=='all')params.set('category',category);if(query.trim())params.set('q',query.trim())
        const r=await fetch(`/api/products?${params}`,{signal:abort.signal});if(!r.ok)throw new Error('Бүтээгдэхүүнийг ачаалж чадсангүй. Дахин оролдоно уу.')
        const data=await r.json();if(!abort.signal.aborted)setProducts(data)
      }catch(e){if(!abort.signal.aborted)setError(e instanceof Error?e.message:'Холболтын алдаа')}
      finally{if(!abort.signal.aborted)setLoading(false)}
    },220)
    return()=>{clearTimeout(timer);abort.abort()}
  },[category,query,sort])
  function toggleSave(id:string){const next=saved.includes(id)?saved.filter(x=>x!==id):[...saved,id];try{localStorage.setItem('st-saved-products',JSON.stringify(next));window.dispatchEvent(new Event('st-saved-products'))}catch{toast.error('Энэ браузерт хадгалах боломжгүй байна.')}}
  const visible=onlySaved?products.filter(p=>saved.includes(p.id)):products
  function choose(p:Product){detailTrigger.current=document.activeElement as HTMLElement;setSelected(p)}
  function clearQuery(){window.dispatchEvent(new CustomEvent('st-search',{detail:''}))}
  return <section id="products" className="store-catalog store-container">
    <div className="store-catalog-heading"><div><span className="store-eyebrow">THE TOOL COLLECTION</span><h2>Хэрэгслээ сонго.</h2></div><p>Таны дараагийн боломж эндээс эхэлнэ.</p></div>
    <div className="store-catalog-layout">
    <aside className="store-catalog-sidebar"><h3>Ангилал</h3>
      <div className="store-category-tabs" role="group" aria-label="Ангиллаар шүүх"><button className={category==='all'?'active':''} aria-pressed={category==='all'} onClick={()=>setCategory('all')}>Бүх хэрэгсэл <span>{initialProducts.length}</span></button>{categories.filter(c=>c.slug!=='all').map(c=><button key={c.id} className={category===c.slug?'active':''} aria-pressed={category===c.slug} onClick={()=>setCategory(c.slug)}>{c.name}</button>)}</div>
      <div className="store-sidebar-help"><Headphones/><strong>Сонгоход тусламж хэрэгтэй юу?</strong><button onClick={()=>window.dispatchEvent(new Event('st-open-chat'))}>Бидэнтэй ярилцах <ArrowRight size={15}/></button></div>
    </aside>
    <div className="store-catalog-results">
    <div className="store-filter-bar">
      <span className="store-results-label">{category==='all'?'Бүх бүтээгдэхүүн':categories.find(c=>c.slug===category)?.name}</span>
      <div className="store-filter-controls"><label className="store-sort"><SlidersHorizontal size={17}/><select aria-label="Эрэмбэлэх" value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">Эрэмбэлэх: Онцлох</option><option value="rating">Үнэлгээ өндөр</option><option value="price-asc">Үнэ: Багаас их</option><option value="price-desc">Үнэ: Ихээс бага</option></select></label><div className="store-view-switch"><button aria-label="Карт харагдац" aria-pressed={view==='grid'} className={view==='grid'?'active':''} onClick={()=>setView('grid')}><Grid2X2 size={18}/></button><button aria-label="Жагсаалт харагдац" aria-pressed={view==='list'} className={view==='list'?'active':''} onClick={()=>setView('list')}><List size={18}/></button></div></div>
    </div>
    <div className="store-catalog-meta"><p aria-live="polite">{loading?'Ачаалж байна…':`${visible.length} бүтээгдэхүүн`}{query&&<> · “{query}” <button onClick={clearQuery}>Цэвэрлэх</button></>}</p><button aria-pressed={onlySaved} className={onlySaved?'active':''} onClick={()=>setOnlySaved(v=>!v)}><Heart size={14}/> Хадгалсан ({saved.length})</button></div>
    {error&&<p role="alert" className="store-error">{error}</p>}
    {!visible.length?<div className="store-empty"><PackageOpen/><h2>Бүтээгдэхүүн олдсонгүй</h2><p>Өөр ангилал эсвэл хайлтын үг сонгоорой.</p><button onClick={()=>{clearQuery();setCategory('all');setOnlySaved(false)}}>Бүгдийг үзэх <ArrowRight size={16}/></button></div>:<div className={`store-market-grid ${view==='list'?'is-list':''}`} aria-busy={loading}>
      {visible.map(p=><ProductCard key={p.id} product={p} onSelect={choose}/>)}
    </div>}
    </div></div>
    <Dialog open={!!selected} onOpenChange={open=>{if(!open)setSelected(null)}}>
      <DialogContent className="store-detail-dialog" aria-describedby={undefined} onCloseAutoFocus={e=>{e.preventDefault();detailTrigger.current?.focus({preventScroll:true})}}>
        {selected&&<><DialogTitle className="sr-only">{selected.name}</DialogTitle><ProductDetail key={selected.id} product={selected} saved={saved.includes(selected.id)} toggleSave={()=>toggleSave(selected.id)} onSupport={()=>{setSelected(null);window.dispatchEvent(new Event('st-open-chat'))}}/></>}
      </DialogContent>
    </Dialog>
  </section>
}
function ProductDetail({product,saved,toggleSave,onSupport}:{product:Product;saved:boolean;toggleSave:()=>void;onSupport:()=>void}){
  const options=licenseOptions(product.duration)
  const [duration,setDuration]=useState(options[0]||'')
  const [quantity,setQuantity]=useState(1)
  const [tab,setTab]=useState('description')
  const gallery=[product.image,...parseImageList(product.instructionImages)].filter(Boolean) as string[]
  const [image,setImage]=useState(gallery[0])
  const add=useCartStore(s=>s.add)
  const features=product.features?.split(';').map(s=>s.trim()).filter(Boolean)||[]
  const tabs=[{id:'description',label:'Бүтээгдэхүүний тайлбар'},{id:'features',label:'Онцлог'},{id:'delivery',label:'Хүргэлт, тусламж'}]
  const addProduct=()=>{if(!product.available)return;add({id:product.id,name:product.name,price:licensePrice(product,duration),duration,icon:product.icon,category:product.category},quantity);toast.success(`${product.name} сагсанд нэмэгдлээ`)}
  return <article className="store-product-detail">
    <div className="store-detail-gallery"><ProductImage image={image} icon={product.icon} alt={product.name} className="aspect-square w-full"/>{gallery.length>1&&<div className="store-thumbnails">{gallery.map((src,i)=><button key={`${src}-${i}`} aria-label={`${i+1}-р зураг`} aria-pressed={image===src} onClick={()=>setImage(src)}><img src={src} alt="" loading="lazy"/></button>)}</div>}</div>
    <div className="store-detail-summary"><p className="store-breadcrumb">Нүүр / {product.category}</p><h2>{product.name}</h2><div className="store-detail-rating"><span>{[0,1,2,3,4].map(i=><Star key={i} size={13} fill={i<Math.round(product.rating)?'#ffaa00':'none'} color="#ffaa00"/>)}</span><small>{product.rating.toFixed(1)} ({product.reviewCount} сэтгэгдэл)</small></div><p className="store-detail-excerpt">{product.shortDesc}</p><strong className="store-detail-price">{formatTugrik(licensePrice(product,duration))}</strong><LicenseSelector options={options} value={duration} onChange={setDuration}/>
      <div className="store-detail-quantity"><label htmlFor={`quantity-${product.id}`}>Тоо ширхэг</label><input id={`quantity-${product.id}`} type="number" min={1} max={99} value={quantity} onChange={e=>setQuantity(Math.max(1,Math.min(99,Math.floor(Number(e.target.value)||1))))}/></div>
      <div className="store-detail-actions"><button className="store-primary" onClick={addProduct} disabled={!product.available}><ShoppingCart size={17}/>{product.available?'Сагсанд нэмэх':'Түр дууссан'}</button><button className="store-save" aria-label={saved?'Хадгалснаас хасах':'Хадгалах'} aria-pressed={saved} onClick={toggleSave}><Heart size={18} fill={saved?'currentColor':'none'}/></button></div>
    </div>
    <div className="store-detail-content"><div className="store-detail-tabs" role="tablist" aria-label="Бүтээгдэхүүний мэдээлэл">{tabs.map((t,i)=><button role="tab" id={`tab-${product.id}-${t.id}`} aria-selected={tab===t.id} aria-controls={`panel-${product.id}`} tabIndex={tab===t.id?0:-1} key={t.id} onClick={()=>setTab(t.id)} onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const next=tabs[(i+(e.key==='ArrowRight'?1:2))%3];setTab(next.id);document.getElementById(`tab-${product.id}-${next.id}`)?.focus()}}}>{t.label}</button>)}</div><div role="tabpanel" id={`panel-${product.id}`} aria-labelledby={`tab-${product.id}-${tab}`} className="store-detail-panel" tabIndex={0}>
      {tab==='description'&&<><h3>Бүтээгдэхүүний тайлбар</h3><ProductDescription text={product.description}/></>}
      {tab==='features'&&<><h3>Үндсэн боломжууд</h3>{features.length?<ul>{features.map(f=><li key={f}><Check size={15}/>{f}</li>)}</ul>:<p>Нэмэлт мэдээллийг админаас лавлаарай.</p>}</>}
      {tab==='delivery'&&<><h3>Хүргэлт, тусламж</h3><p>Төлбөр баталгаажсаны дараа захиалгын мэдээллээ «Миний аккаунт» хэсгээс шалгаарай.</p><button className="store-support-link" onClick={onSupport}>Админтай холбогдох <ArrowRight size={15}/></button></>}
    </div></div>
  </article>
}
