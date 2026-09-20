'use client'
import { useEffect, useState } from 'react'
import { ArrowRight, Pause, Play, Sparkles, LayoutGrid, ShieldCheck, Facebook, Instagram, Music2, BrainCircuit, Youtube } from 'lucide-react'
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

export function Hero({settings,productCount,categoryCount}:{settings?:Record<string,string>;productCount:number;categoryCount:number}) {
  const [paused,setPaused]=useState(false)
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
          <span className="hero-app hero-app-instagram"><Instagram/></span>
          <span className="hero-app hero-app-facebook"><Facebook fill="currentColor"/></span>
          <span className="hero-app hero-app-ai"><BrainCircuit/></span>
          <span className="hero-app hero-app-video"><Youtube fill="currentColor"/></span>
          <span className="hero-app hero-app-music"><Music2/></span>
        </div>

      </div>
      <button type="button" className="hero-motion-control" aria-pressed={paused} onClick={()=>setPaused(p=>!p)}>{paused?<Play size={14}/>:<Pause size={14}/>}<span>{paused?'Хөдөлгөөн асаах':'Хөдөлгөөн зогсоох'}</span></button>
    </div>
  </section>
}
