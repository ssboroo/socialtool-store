'use client'

import { ArrowRight, Bot, Facebook, Headphones, Instagram, Music2, ShieldCheck, TrendingUp, Zap } from 'lucide-react'

export function Hero({ settings }: { settings?: Record<string, string> }) {
  return <section id="top" className="store-hero store-container">
    <div className="store-hero-surface">
      <div className="store-hero-copy">
        <span className="store-eyebrow">ТАНЫ ДИЖИТАЛ ДЭЛГҮҮР</span>
        <h1>Дижитал өсөлтийн<br />бүх хэрэгсэл нэг дор</h1>
        <p>{settings?.heroSubtext || 'SMM, автоматжуулалт, AI болон бүтээмжийн хэрэгслүүдийг найдвартай, хурдан, хялбар.'}</p>
        <div className="store-trust">
          {[{Icon:ShieldCheck,title:'Найдвартай',text:'Баталгаат үйлчилгээ'},{Icon:Zap,title:'Шуурхай хүргэлт',text:'Хялбар худалдан авалт'},{Icon:Headphones,title:'24/7 Дэмжлэг',text:'Асуудал гарвал тусална'}].map(({Icon,title,text})=><div key={title}><span><Icon /></span><div><strong>{title}</strong><small>{text}</small></div></div>)}
        </div>
      </div>
      <div className="store-hero-art">
        <div className="glass-orbit" aria-hidden="true" />
        <div className="glass-platform instagram-tile" aria-hidden="true"><span><Instagram /></span></div>
        <div className="glass-platform ai-tile" aria-hidden="true"><span><Bot /></span></div>
        <div className="glass-platform facebook-tile" aria-hidden="true"><span><Facebook /></span></div>
        <div className="glass-platform tiktok-tile" aria-hidden="true"><span><Music2 /></span></div>
        <div className="glass-growth" aria-hidden="true"><TrendingUp /><div>{[24,40,59,84].map(h=><i key={h} style={{height:h}} />)}</div></div>
        <button className="glass-message" onClick={()=>document.querySelector('#products')?.scrollIntoView({behavior:'smooth'})}><span>Илүү бүтээмж<br />Илүү боломж<br /><strong>Илүү амжилт</strong></span><ArrowRight /></button>
      </div>
    </div>
  </section>
}
