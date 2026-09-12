'use client'

import { ArrowRight, Play, Sparkles, ShieldCheck, Zap, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { heroImages } from '@/lib/hero-images'
import { HeroSlideshow } from './hero-slideshow'

const floatingCards = [
  { label: 'Facebook', icon: 'f', color: 'from-[#1677FF] to-[#0B4DBA]', x: 'top-[6%] left-[2%]', delay: '0s' },
  { label: 'Instagram', icon: 'IG', color: 'from-[#E1306C] to-[#F77737]', x: 'top-[2%] right-[6%]', delay: '1.5s' },
  { label: 'TikTok', icon: 'TT', color: 'from-[#1677FF] to-[#102A43]', x: 'top-[34%] left-[0%]', delay: '0.8s' },
  { label: 'Telegram', icon: 'TG', color: 'from-[#0B4DBA] to-[#1677FF]', x: 'top-[60%] left-[8%]', delay: '2.2s' },
  { label: 'И-мэйл', icon: '@', color: 'from-[#16A34A] to-[#0B4DBA]', x: 'top-[26%] right-[0%]', delay: '1.1s' },
  { label: 'AI', icon: 'AI', color: 'from-[#8B5CF6] to-[#1677FF]', x: 'top-[64%] right-[4%]', delay: '0.4s' },
]

function scrollTo(id: string) {
  document.querySelector(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function Hero({ settings }: { settings?: Record<string, string> }) {
  const headline = settings?.heroHeadline || 'Таны дижитал ажлын хүчирхэг хэрэгслүүд'
  const savedSubtext = settings?.heroSubtext === 'Social media, AI, automation болон marketing хэрэгслүүдийг нэг дороос аюулгүй, хурдан аваарай.' ? '' : settings?.heroSubtext
  const subtext = savedSubtext || 'Сошиал хуудас удирдах, ажлаа автоматжуулах, маркетинг болон хиймэл оюуны хэрэгслүүдийг нэг дороос сонгоорой.'
  const primaryCta = settings?.heroPrimaryCta || 'Бүх хэрэгсэл үзэх'
  const secondaryCta = settings?.heroSecondaryCta || 'Хэрхэн захиалах вэ?'
  const slides = heroImages(settings)
  const headlineParts = headline.split(' ')
  const highlight = headlineParts.length > 1 ? headlineParts.pop()! : ''
  const headlineMain = headlineParts.join(' ')

  return (
    <section id="top" className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 hero-grid" aria-hidden />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[520px] w-[820px] -translate-x-1/2 blue-glow" aria-hidden />
      <div className="pointer-events-none absolute top-1/3 -right-20 h-[320px] w-[320px] blue-glow opacity-60" aria-hidden />

      <div className="relative mx-auto max-w-[1500px] px-4 pt-12 pb-16 sm:px-6 lg:px-8 lg:pt-20 lg:pb-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-10">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D6E4FF] bg-white px-3 py-1.5 shadow-premium">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#16A34A] opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-[#16A34A]" />
              </span>
              <span className="text-xs font-semibold text-[#102A43]">Таны дижитал хэрэгслийн дэлгүүр</span>
            </div>

            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-[#102A43] sm:text-5xl lg:text-[56px]">
              {headlineMain ? `${headlineMain} ` : ''}{highlight && <span className="gradient-text">{highlight}</span>}
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base text-[#5B7290] sm:text-lg lg:mx-0">{subtext}</p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <Button
                onClick={() => scrollTo('#products')}
                size="lg"
                className="h-12 w-full gap-2 rounded-full bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] px-7 text-base text-white shadow-premium-lg hover:shadow-premium-lg sm:w-auto"
              >
                {primaryCta}
                <ArrowRight className="size-4" />
              </Button>
              <Button
                onClick={() => scrollTo('#how')}
                size="lg"
                variant="outline"
                className="h-12 w-full gap-2 rounded-full border-[#D6E4FF] bg-white/80 px-7 text-base text-[#102A43] backdrop-blur hover:bg-[#E8F1FF] sm:w-auto"
              >
                <Play className="size-4" />
                {secondaryCta}
              </Button>
            </div>

            <div className="mx-auto mt-9 grid max-w-md grid-cols-3 gap-3 lg:mx-0">
              {[
                { k: 'Сошиал', v: 'удирдлагын хэрэгсэл' },
                { k: 'AI', v: 'хиймэл оюун' },
                { k: 'Программ', v: 'дижитал бүтээгдэхүүн' },
              ].map((s) => (
                <div key={s.v} className="text-center lg:text-left">
                  <div className="text-2xl font-extrabold text-[#102A43]">{s.k}</div>
                  <div className="text-xs text-[#5B7290]">{s.v}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[#5B7290] lg:justify-start">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-4 text-[#16A34A]" /> Аюулгүй төлбөр</span>
              <span className="inline-flex items-center gap-1.5"><Zap className="size-4 text-[#1677FF]" /> Дижитал бүтээгдэхүүн</span>
              <span className="inline-flex items-center gap-1.5"><Sparkles className="size-4 text-[#8B5CF6]" /> Хэрэглэгчийн тусламж</span>
            </div>
          </div>

          {slides.length > 0 ? (
            <HeroSlideshow images={slides} />
          ) : (
            <div className="relative h-[380px] sm:h-[460px] lg:h-[520px]">
              <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                  <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-[#1677FF]/20 to-[#8B5CF6]/20 blur-2xl" />
                  <div className="relative w-[220px] rounded-[1.75rem] border border-[#D6E4FF] bg-white/90 p-5 shadow-premium-lg backdrop-blur-xl sm:w-[260px]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#1677FF] to-[#0B4DBA] font-bold text-white">ST</div>
                        <div>
                          <div className="text-sm font-bold text-[#102A43]">SOCIALTOOL</div>
                          <div className="text-[10px] text-[#5B7290]">All-in-one suite</div>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#16A34A]/10 px-2 py-0.5 text-[10px] font-semibold text-[#16A34A]">
                        <span className="size-1.5 rounded-full bg-[#16A34A]" /> Active
                      </span>
                    </div>
                    <div className="mt-4 space-y-2">
                      {[
                        { label: 'Facebook', v: 92, c: 'bg-[#1677FF]' },
                        { label: 'Instagram', v: 78, c: 'bg-[#E1306C]' },
                        { label: 'TikTok', v: 64, c: 'bg-[#102A43]' },
                      ].map((r) => (
                        <div key={r.label}>
                          <div className="flex justify-between text-[11px] text-[#5B7290]">
                            <span>{r.label}</span>
                            <span className="font-semibold text-[#102A43]">{r.v}%</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#EEF4FF]">
                            <div className={`h-full rounded-full ${r.c}`} style={{ width: `${r.v}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between rounded-xl bg-[#F5F9FF] px-3 py-2">
                      <div className="flex items-center gap-1">
                        {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="size-3.5 fill-[#F59E0B] text-[#F59E0B]" />)}
                      </div>
                      <span className="text-[11px] font-semibold text-[#102A43]">4.9 / 5.0</span>
                    </div>
                  </div>
                </div>
              </div>

              {floatingCards.map((c) => (
                <div key={c.label} className={`absolute ${c.x} animate-float`} style={{ animationDelay: c.delay }}>
                  <div className="flex items-center gap-2 rounded-2xl border border-[#D6E4FF] bg-white/90 px-3 py-2 shadow-premium backdrop-blur">
                    <div className={`grid size-8 place-items-center rounded-xl bg-gradient-to-br ${c.color} text-[11px] font-bold text-white`}>{c.icon}</div>
                    <span className="pr-1 text-xs font-semibold text-[#102A43]">{c.label}</span>
                  </div>
                </div>
              ))}

              <svg className="absolute inset-0 h-full w-full" aria-hidden>
                <defs>
                  <linearGradient id="line" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#1677FF" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#1677FF" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[
                  'M 40 60 Q 120 100 200 200',
                  'M 320 80 Q 260 160 220 220',
                  'M 30 240 Q 120 240 200 240',
                  'M 330 260 Q 280 250 240 250',
                  'M 60 360 Q 140 320 200 280',
                  'M 330 360 Q 280 320 240 290',
                ].map((d, i) => (
                  <path key={i} d={d} fill="none" stroke="url(#line)" strokeWidth="1.5" className="animate-pulse-line" style={{ animationDelay: `${i * 0.4}s` }} />
                ))}
              </svg>

              {[
                'left-[12%] top-[20%]', 'left-[88%] top-[18%]',
                'left-[6%] top-[70%]', 'left-[92%] top-[68%]',
                'left-[50%] top-[8%]', 'left-[48%] top-[90%]',
              ].map((p, i) => (
                <span key={i} className={`absolute ${p} size-1.5 rounded-full bg-[#1677FF] animate-float`} style={{ animationDelay: `${i * 0.6}s` }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
