'use client'

import {
  Facebook, Music2, Instagram, Twitter, Send, Mail, Sparkles, LayoutGrid, ArrowRight,
} from 'lucide-react'
import { useState } from 'react'

const ICONS: Record<string, { Icon: React.ComponentType<{ className?: string }>; gradient: string }> = {
  Facebook: { Icon: Facebook, gradient: 'from-[#1877F2] to-[#0B4DBA]' },
  Music2: { Icon: Music2, gradient: 'from-[#102A43] to-[#1677FF]' },
  Instagram: { Icon: Instagram, gradient: 'from-[#E1306C] to-[#F77737]' },
  Twitter: { Icon: Twitter, gradient: 'from-[#102A43] to-[#5B7290]' },
  Send: { Icon: Send, gradient: 'from-[#0B4DBA] to-[#1677FF]' },
  Mail: { Icon: Mail, gradient: 'from-[#16A34A] to-[#0B4DBA]' },
  Sparkles: { Icon: Sparkles, gradient: 'from-[#8B5CF6] to-[#1677FF]' },
  LayoutGrid: { Icon: LayoutGrid, gradient: 'from-[#1677FF] to-[#0B4DBA]' },
}

interface Category {
  id: string
  name: string
  slug: string
  icon: string
  description: string | null
  order: number
}

export function Categories({ categories }: { categories: Category[] }) {
  const [active, setActive] = useState<string>('all')

  const handleSelect = (slug: string) => {
    setActive(slug)
    window.dispatchEvent(new CustomEvent('st-category', { detail: slug }))
    document.querySelector('#products')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section id="categories" className="relative py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D6E4FF] bg-white px-3 py-1 text-xs font-semibold text-[#1677FF] shadow-sm">
            <Sparkles className="size-3.5" /> Ангилал
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#102A43] sm:text-4xl">
            Алдартай <span className="gradient-text">ангиллууд</span>
          </h2>
          <p className="mt-3 text-[#5B7290]">
            Өөрийн хэрэгцээнд тохирох хэрэгслийг сонгож аваарай
          </p>
        </div>

        <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:mt-10 lg:grid-cols-4 lg:gap-5">
          {categories.map((c) => {
            const meta = ICONS[c.icon] || ICONS.LayoutGrid
            const { Icon } = meta
            const isActive = active === c.slug
            return (
              <button
                type="button"
                key={c.id}
                aria-pressed={isActive}
                onClick={() => handleSelect(c.slug)}
                className={`group relative min-h-[164px] overflow-hidden rounded-2xl border bg-white p-4 text-left transition-all duration-300 sm:min-h-[176px] sm:p-5 ${
                  isActive
                    ? 'border-[#1677FF] ring-2 ring-[#1677FF]/15 shadow-premium-lg'
                    : 'border-[#D6E4FF] shadow-premium hover:-translate-y-1 hover:border-[#1677FF]/40 hover:shadow-premium-lg'
                }`}
              >
                <div className="absolute -right-6 -top-6 size-24 rounded-full bg-gradient-to-br from-[#1677FF]/8 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className={`relative grid size-11 place-items-center rounded-2xl bg-gradient-to-br shadow-premium sm:size-12 ${meta.gradient}`}>
                  <Icon className="size-5 text-white sm:size-6" />
                </div>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <h3 className="line-clamp-2 text-sm font-bold leading-snug text-[#102A43] sm:text-[15px]">{c.name}</h3>
                  <ArrowRight className="size-4 shrink-0 text-[#5B7290] transition-all group-hover:translate-x-1 group-hover:text-[#1677FF]" />
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#5B7290] sm:text-xs">
                  {c.description || 'Хэрэгсэл үзэх'}
                </p>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
