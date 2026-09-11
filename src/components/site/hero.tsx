'use client'
import { ArrowUpRight, Headphones, ShieldCheck } from 'lucide-react'
import { ProductImage } from './product-illustration'
import type { Product } from './product-card'
import { formatTugrik } from '@/lib/format'

export function Hero({ settings, product }: { settings?: Record<string, string>; product?: Product }) {
  return <section id="top" className="store-hero store-container">
    <div className="store-hero-copy">
      <span className="store-eyebrow">SOCIAL / AI / AUTOMATION</span>
      <h1>Илүү ухаалаг<br /><span>дижитал ажил.</span></h1>
      <p>{settings?.heroSubtext || 'Таны ажлыг хөнгөвчлөх сошиал, AI болон автоматжуулалтын хэрэгслүүд.'}</p>
      <div className="store-trust"><span><ShieldCheck size={16}/> Аюулгүй төлбөр</span><button onClick={()=>window.dispatchEvent(new Event('st-open-chat'))}><Headphones size={16}/> Сонголтод тусалъя</button></div>
    </div>
    {product && <button className="store-spotlight" onClick={()=>window.dispatchEvent(new CustomEvent('st-product',{detail:product.id}))} aria-label={`${product.name} — дэлгэрэнгүй`}>
      <div className="store-spotlight-top"><span>ОНЦЛОХ СОНГОЛТ</span><ArrowUpRight size={22}/></div>
      <div className="store-spotlight-main"><ProductImage image={product.image} icon={product.icon} alt="" className="store-spotlight-image"/><div><span className="store-spotlight-category">{product.category}</span><h2>{product.name}</h2><strong>{formatTugrik(product.price)}</strong></div></div>
      <div className="store-spotlight-bottom"><span>Бүтээгдэхүүнтэй танилцах</span><ArrowUpRight size={18}/></div>
    </button>}
  </section>
}
