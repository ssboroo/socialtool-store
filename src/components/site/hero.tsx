'use client'

import { ArrowRight, Play, Sparkles, ShieldCheck, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

function scrollTo(id: string) {
  document.querySelector(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function Hero({ settings }: { settings?: Record<string, string> }) {
  const headline = settings?.heroHeadline || 'Таны дижитал ажлын хүчирхэг хэрэгслүүд'
  const subtext = settings?.heroSubtext || 'Social media, AI, automation болон marketing хэрэгслүүдийг нэг дороос аюулгүй, хурдан аваарай.'
  const primaryCta = settings?.heroPrimaryCta || 'Бүх хэрэгсэл үзэх'
  const secondaryCta = settings?.heroSecondaryCta || 'Хэрхэн ажиллах вэ?'
  // split headline to keep the gradient-text highlight on the last word(s)
  const headlineParts = headline.split(' ')
  const highlight = headlineParts.length > 1 ? headlineParts.pop()! : ''
  const headlineMain = headlineParts.join(' ')

  return (
    <section id="top" className="relative overflow-hidden">
      {/* background glow + grid */}
      <div className="pointer-events-none absolute inset-0 hero-grid" aria-hidden />
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[520px] w-[820px] blue-glow" aria-hidden />
      <div className="pointer-events-none absolute top-1/3 -right-20 h-[320px] w-[320px] blue-glow opacity-60" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-8 items-center">
          {/* Left: copy */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D6E4FF] bg-white px-3 py-1.5 shadow-premium">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#16A34A] opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-[#16A34A]" />
              </span>
              <span className="text-xs font-semibold text-[#102A43]">
                12,000+ хэрэглэгчид итгэж байна
              </span>
            </div>

            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-[56px] font-extrabold leading-[1.05] tracking-tight text-[#102A43]">
              {headlineMain ? `${headlineMain} ` : ''}{highlight && <span className="gradient-text">{highlight}</span>}
            </h1>

            <p className="mt-5 text-base sm:text-lg text-[#5B7290] max-w-xl mx-auto lg:mx-0">
              {subtext}
            </p>

            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <Button
                onClick={() => scrollTo('#products')}
                size="lg"
                className="h-12 px-7 rounded-full bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white shadow-premium-lg hover:shadow-premium-lg text-base gap-2 w-full sm:w-auto"
              >
                {primaryCta}
                <ArrowRight className="size-4" />
              </Button>
              <Button
                onClick={() => scrollTo('#how')}
                size="lg"
                variant="outline"
                className="h-12 px-7 rounded-full bg-white/80 backdrop-blur border-[#D6E4FF] text-[#102A43] hover:bg-[#E8F1FF] text-base gap-2 w-full sm:w-auto"
              >
                <Play className="size-4" />
                {secondaryCta}
              </Button>
            </div>

            {/* stats */}
            <div className="mt-9 grid grid-cols-3 gap-3 max-w-md mx-auto lg:mx-0">
              {[
                { k: '15+', v: 'хэрэгсэл' },
                { k: '24/7', v: 'тусламж' },
                { k: '4.9★', v: 'үнэлгээ' },
              ].map((s) => (
                <div key={s.v} className="text-center lg:text-left">
                  <div className="text-2xl font-extrabold text-[#102A43]">{s.k}</div>
                  <div className="text-xs text-[#5B7290]">{s.v}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-xs text-[#5B7290]">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-[#16A34A]" /> Аюулгүй төлбөр
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Zap className="size-4 text-[#1677FF]" /> Шууд хүргэлт
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="size-4 text-[#8B5CF6]" /> 7 хоногийн баталгаа
              </span>
            </div>
          </div>

          <div className="hero-poster relative mx-auto w-full max-w-xl rounded-[2rem] border border-white bg-white/70 p-3 shadow-[0_30px_90px_-25px_#1677ff60] sm:p-5">
            <div className="overflow-hidden rounded-[1.5rem] border border-[#D6E4FF] bg-white">
              <div className="flex items-center justify-between border-b border-[#E8F1FF] px-5 py-4">
                <span className="text-xs font-semibold tracking-[0.2em] text-[#5B7290]">SOCIALTOOL.STORE</span>
                <div className="flex gap-1.5" aria-hidden>{[1,2,3].map(i => <span key={i} className="size-2 rounded-full bg-[#D6E4FF]" />)}</div>
              </div>
              <div className="relative overflow-hidden bg-[#082A62] px-6 py-8 text-white sm:px-8">
                <div aria-hidden className="hero-orbit pointer-events-none absolute -right-12 -top-20 size-64 rounded-full border-[35px] border-blue-400/15" />
                <span className="relative inline-flex items-center gap-2 text-xs font-medium text-blue-200"><Sparkles className="size-4" /> Таны дижитал хэрэгслийн дэлгүүр</span>
                <h2 className="relative mt-5 text-4xl font-black tracking-tight sm:text-5xl">SOCIAL<span className="text-[#65B6FF]">TOOL</span><span className="text-[#65B6FF]">.</span></h2>
                <p className="relative mt-3 max-w-xs text-sm leading-relaxed text-blue-100">Нэг сонголт. Илүү олон боломж.<br />Ажлаа хялбарчлах хэрэгслээ эндээс.</p>
                <div className="relative mt-6 flex flex-wrap gap-2">
                  {['Программ', 'Автоматжуулалт', 'AI хэрэгсэл'].map(t => <span key={t} className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs">{t}</span>)}
                </div>
              </div>
              <div className="p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between"><span className="text-sm font-bold text-[#102A43]">Танд хэрэгтэй платформууд</span><span className="text-xs text-[#5B7290]">Нэг дор</span></div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {[
                    { name: 'Facebook', icon: 'f', color: '#1877F2' },
                    { name: 'Instagram', icon: 'IG', color: '#D63384' },
                    { name: 'TikTok', icon: '♪', color: '#102A43' },
                    { name: 'Telegram', icon: 'TG', color: '#229ED9' },
                    { name: 'И-мэйл', icon: '@', color: '#07866B' },
                    { name: 'AI хэрэгсэл', icon: 'AI', color: '#7555E8' },
                  ].map(t => <div key={t.name} className="hero-platform flex items-center gap-2 rounded-xl border border-[#E8F1FF] bg-[#F8FAFF] px-3 py-3"><span className="grid size-8 shrink-0 place-items-center rounded-lg text-xs font-extrabold text-white" style={{ background: t.color }}>{t.icon}</span><span className="text-xs font-semibold text-[#102A43]">{t.name}</span></div>)}
                </div>
                <button onClick={() => scrollTo('#products')} className="mt-5 flex w-full items-center justify-between rounded-xl bg-[#E8F1FF] px-4 py-3 text-sm font-bold text-[#0B4DBA] transition-colors hover:bg-[#D6E4FF]">Хэрэгслээ сонгох <ArrowRight className="size-4" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
