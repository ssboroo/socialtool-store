'use client'
import { ArrowRight, Play, Sparkles, LayoutGrid, ShieldCheck, Facebook, Instagram, Music2, BrainCircuit, Youtube } from 'lucide-react'
import { heroImages } from '@/lib/hero-images'
import { HeroVideo } from './hero-video'
import { validHeroVideo } from '@/lib/hero-video'
import { HeroSlideshow } from './hero-slideshow'
export function StoreIntroduction({settings}:{settings?:Record<string,string>}) {
  const slides=heroImages(settings)
  const video=settings?.heroVideoUrl
  const useVideo=settings?.heroMediaType==='video' && !!video && validHeroVideo(video)
  if (!useVideo && slides.length === 0 && !settings?.heroHeadline) return null
  return <details className="store-introduction"><summary><Play size={16}/>Дэлгүүрийн танилцуулга</summary>{settings?.heroHeadline&&<p className="store-introduction-headline">{settings.heroHeadline}</p>}{useVideo?<HeroVideo key={video} src={video!} poster={slides[0]}/>:slides.length>0?<HeroSlideshow images={slides}/>:null}</details>
}

export function Hero({settings,productCount,categoryCount}:{settings?:Record<string,string>;productCount:number;categoryCount:number}) {
  return <section id="top" className="shop-hero">
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
        <div className="hero-showcase-scene">
          <img className="hero-glass-art" src="/hero-glass.webp" alt="" width={1100} height={733} fetchPriority="high"/>
          <img className="hero-original-logo" src="/socialtool-logo-s.png" alt="" width={166} height={181}/>
          <span className="hero-app hero-app-instagram"><Instagram/></span>
          <span className="hero-app hero-app-facebook"><Facebook fill="currentColor"/></span>
          <span className="hero-app hero-app-ai"><BrainCircuit/></span>
          <span className="hero-app hero-app-video"><Youtube fill="currentColor"/></span>
          <span className="hero-app hero-app-music"><Music2/></span>
        </div>
        <span className="hero-art-caption">Tools.<br/>People.<br/>Possibilities.</span>
        <div className="hero-glass-note"><ShieldCheck/><span>Таны дижитал<br/>туслагч.</span></div>
      </div>
    </div>
  </section>
}
