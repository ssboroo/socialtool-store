'use client'
import { ArrowRight, Play, Sparkles, Monitor, Workflow } from 'lucide-react'
import { heroImages } from '@/lib/hero-images'
import { HeroSlideshow } from './hero-slideshow'
export function Hero({settings}:{settings?:Record<string,string>}) {
  const slides=heroImages(settings)
  return <section id="top" className="shop-hero">
    <div className="shop-hero-inner">
      <div className="shop-hero-copy">
        <span className="catalog-eyebrow"><Sparkles className="size-4"/>ТАНЫ ДИЖИТАЛ ТУСЛАГЧ</span>
        <h1>{settings?.heroHeadline||'Ажлаа хялбарчил.'}</h1>
        <p>{settings?.heroSubtext||'Сошиал медиа, программ болон AI хэрэгслүүд. Хэрэгтэй бүхнээ нэг дороос сонгоорой.'}</p>
        <div className="shop-hero-actions"><a href="#products" className="shop-primary-link">{settings?.heroPrimaryCta||'Бүх хэрэгсэл үзэх'}<ArrowRight className="size-4"/></a><a href="#how" className="shop-secondary-link"><Play className="size-4"/>{settings?.heroSecondaryCta||'Хэрхэн захиалах вэ?'}</a></div>
        <div className="shop-hero-topics" aria-label="Хэрэгслийн төрлүүд"><span><Sparkles size={17}/>AI хэрэгсэл</span><span><Monitor size={17}/>Программ</span><span><Workflow size={17}/>Автоматжуулалт</span></div>
      </div>
      <div className="shop-hero-visual">{slides.length>0?<HeroSlideshow images={slides}/>:<div className="shop-hero-placeholder"><Sparkles className="size-12"/><strong>SOCIALTOOL<span>.STORE</span></strong><p>Илүү олон боломж.<br/>Нэг дор.</p></div>}</div>
    </div>
  </section>
}
