'use client'

import { useEffect, useState } from 'react'
import { Gift, Timer, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

function useCountdown(deadline: Date) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    const tick = () => setNow(Date.now())
    const initial = window.setTimeout(tick, 0)
    const timer = window.setInterval(tick, 1000)
    return () => {
      window.clearTimeout(initial)
      window.clearInterval(timer)
    }
  }, [])
  const diff = Math.max(0, deadline.getTime() - (now ?? deadline.getTime()))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  const seconds = Math.floor((diff / 1000) % 60)
  return { days, hours, minutes, seconds }
}

export function PromoBanner({ promotion, settings }: {
  promotion?: { title: string; description: string; badgeText: string; discountPercent: number; endAt: string } | null
  settings?: Record<string, string>
}) {
  const deadline = new Date(promotion?.endAt || 0)
  const { days, hours, minutes, seconds } = useCountdown(deadline)

  if (!promotion || !Number.isFinite(deadline.getTime())) return null

  const title = promotion?.title || settings?.promoTitle || 'Шинэ хэрэглэгчдэд зориулсан онцгой хямдрал — 30% хүртэл'
  const description = promotion?.description || settings?.promoDescription || 'Анхны захиалгаа хийгчдэд зориулсан онцгой хямдрал. Хугацаа дуустал хүчинтэй.'
  const cta = settings?.promoCta || 'Хямдрал авах'
  const badge = promotion?.badgeText || 'Шинэ хэрэглэгчдэд'
  const discount = promotion?.discountPercent || Number(settings?.promoDiscountPercent || '30')

  const scroll = () =>
    document.querySelector('#products')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <section className="relative py-10 lg:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1677FF] via-[#0B4DBA] to-[#1677FF] p-8 lg:p-12 shadow-premium-lg">
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -left-16 -bottom-24 h-72 w-72 rounded-full bg-[#8B5CF6]/20 blur-2xl" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 30% 20%, white 1px, transparent 1px), radial-gradient(circle at 70% 60%, white 1px, transparent 1px)',
              backgroundSize: '48px 48px, 64px 64px',
            }}
          />

          <div className="relative grid lg:grid-cols-2 gap-8 items-center">
            <div className="text-white">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-1.5 text-xs font-semibold">
                <Gift className="size-4" />
                {badge}
              </div>
              <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold leading-tight">{title}</h2>
              <p className="mt-3 text-white/80 max-w-md">{description}</p>

              <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <Button
                  onClick={scroll}
                  size="lg"
                  className="h-12 px-6 rounded-full bg-white text-[#0B4DBA] hover:bg-white/90 shadow-premium-lg text-base font-bold gap-2"
                >
                  {cta}
                  <ArrowRight className="size-4" />
                </Button>
                <span className="text-xs text-white/70">{discount}% хүртэл хямдрал · QPay-аар төлөх боломжтой</span>
              </div>
            </div>

            <div className="flex lg:justify-end">
              <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-5">
                <div className="flex items-center gap-2 text-white/90">
                  <Timer className="size-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">Үлдсэн хугацаа</span>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2.5">
                  {[
                    { v: days, l: 'Өдөр' },
                    { v: hours, l: 'Цаг' },
                    { v: minutes, l: 'Мин' },
                    { v: seconds, l: 'Сек' },
                  ].map((u) => (
                    <div key={u.l} className="text-center">
                      <div className="grid place-items-center rounded-xl bg-white/95 min-w-14 py-2">
                        <span className="text-2xl font-extrabold text-[#0B4DBA] tabular-nums">{String(u.v).padStart(2, '0')}</span>
                      </div>
                      <span className="mt-1.5 block text-[10px] uppercase tracking-wide text-white/70">{u.l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
