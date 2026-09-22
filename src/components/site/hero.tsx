'use client'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Pause, Play, Sparkles, LayoutGrid, ShieldCheck } from 'lucide-react'
import { ProductIconTile, detectProductIcon } from './product-icon'
import type { Product } from './product-card'
import './hero-product-icons.css'
import { heroImages } from '@/lib/hero-images'
import { HeroVideo } from './hero-video'
import { validHeroVideo } from '@/lib/hero-video'
import { HeroSlideshow } from './hero-slideshow'
export function StoreIntroduction({settings,mobile=false}:{settings?:Record<string,string>;mobile?:boolean}) {
  const [isMobile,setIsMobile]=useState<boolean|null>(null)
  useEffect(()=>{const query=window.matchMedia('(max-width:900px)');const update=()=>setIsMobile(query.matches);update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update)},[])
  const slides=heroImages(settings)
  const video=settings?.heroVideoUrl
  const useVideo=settings?.heroMediaType==='video' && !!video && validHeroVideo(video)
  if(isMobile===null || isMobile!==mobile) return null
  return <section className="store-introduction sidebar-introduction" aria-label="Дэлгүүрийн танилцуулга">
    <h2><Play size={16}/>Дэлгүүрийн танилцуулга</h2>
    {useVideo?<HeroVideo key={video} src={video!} poster={slides[0]}/>:slides.length>0?<HeroSlideshow images={slides}/>:<div className="intro-placeholder"><img src="/socialtool-logo-s.png" alt="Socialtool" width={66} height={72}/><strong>Хэрэгтэй бүхнээ<br/>нэг дороос.</strong></div>}
    {settings?.heroHeadline&&<p className="store-introduction-headline">{settings.heroHeadline}</p>}
    <a href="#how" className="intro-guide-link">Хэрхэн захиалах вэ?<ArrowRight size={15}/></a>
  </section>
}

export function Hero({settings,productCount,categoryCount,products}:{settings?:Record<string,string>;productCount:number;categoryCount:number;products:Product[]}) {
  const [paused,setPaused]=useState(false)
  const [reducedMotion,setReducedMotion]=useState(true)
  const [group,setGroup]=useState(0)
  const brands=useMemo(()=>{
    const seen=new Set<string>()
    return products.filter(product=>{
      if(!product.available) return false
      const key=detectProductIcon(product).key
      if(seen.has(key)) return false
      seen.add(key)
      return true
    })
  },[products])
  const groupCount=Math.ceil(brands.length/6)
  useEffect(()=>{
    const query=window.matchMedia('(prefers-reduced-motion: reduce)')
    const update=()=>setReducedMotion(query.matches)
    update()
    query.addEventListener('change',update)
    return()=>query.removeEventListener('change',update)
  },[])
  useEffect(()=>{
    if(paused||reducedMotion||groupCount<2) return
    const timer=window.setInterval(()=>{
      if(!document.hidden) setGroup(value=>(value+1)%groupCount)
    },5000)
    return()=>window.clearInterval(timer)
  },[paused,reducedMotion,groupCount])
  const activeGroup=groupCount?group%groupCount:0
  const visibleBrands=brands.slice(activeGroup*6,activeGroup*6+6)
  return <section id="top" className={`shop-hero animated-shop-hero ${paused?'hero-motion-paused':''}`}>
    <div className="shop-hero-inner">
      <div className="shop-hero-copy">
        <span className="catalog-eyebrow"><Sparkles size={15}/>Таны дижитал боломжууд — нэг дор</span>
        <h1>Ажлаа хялбарчил.<span>Илүү их боломжийг нээ.</span></h1>
        <p>{settings?.heroSubtext||'Сошиал медиа, программ болон AI хэрэгслүүд. Хэрэгтэй бүхнээ нэг дороос сонгоорой.'}</p>
        <div className="shop-hero-actions"><a href="#products" className="shop-primary-link">{settings?.heroPrimaryCta||'Бүх хэрэгсэл үзэх'}<ArrowRight className="size-4"/></a><a href="#how" className="shop-secondary-link"><Play className="size-4"/>{settings?.heroSecondaryCta||'Хэрхэн захиалах вэ?'}</a></div>
        <div className="hero-facts">
          <div><LayoutGrid/><span><strong>{productCount}</strong><small>Хэрэгсэл</small></span></div>
          <div><Sparkles/><span><strong>{categoryCount}</strong><small>Ангилал</small></span></div>
          <div><ShieldCheck/><span><strong>QPay</strong><small>Төлбөрийн сонголт</small></span></div>
        </div>
      </div>
      <div className="hero-showcase" aria-hidden="true">
        <div className="hero-showcase-scene"><span className="hero-orbit hero-orbit-one"/><span className="hero-orbit hero-orbit-two"/>
          <span className="hero-center-glass"/>
          <img className="hero-original-logo" src="/socialtool-logo-s.png" alt="" width={166} height={181}/>
          {visibleBrands.map((product,index)=><span key={product.id} className={`hero-app hero-product-orbit hero-product-orbit-${index}`}>
            <ProductIconTile name={product.name} category={product.category} icon={product.icon} compact/>
          </span>)}
        </div>

      </div>
      <button type="button" className="hero-motion-control" aria-pressed={paused} onClick={()=>setPaused(p=>!p)}>{paused?<Play size={14}/>:<Pause size={14}/>}<span>{paused?'Хөдөлгөөн асаах':'Хөдөлгөөн зогсоох'}</span></button>
    </div>
  </section>
}
