'use client'

import {
  Facebook, Music2, Instagram, Twitter, Send, Mail, Sparkles, LayoutGrid, ArrowRight,
} from 'lucide-react'
import { useEffect, useState } from 'react'

const ICONS: Record<string, { Icon: React.ComponentType<{ className?: string }>; gradient: string; bg: string; fg: string }> = {
  Facebook: { Icon: Facebook, gradient: 'from-[#1877F2] to-[#0B4DBA]', bg: 'bg-[#E8F1FF]', fg: 'text-[#1677FF]' },
  Music2: { Icon: Music2, gradient: 'from-[#102A43] to-[#1677FF]', bg: 'bg-[#EEF4FF]', fg: 'text-[#0B4DBA]' },
  Instagram: { Icon: Instagram, gradient: 'from-[#E1306C] to-[#F77737]', bg: 'bg-[#FFE8F0]', fg: 'text-[#E1306C]' },
  Twitter: { Icon: Twitter, gradient: 'from-[#102A43] to-[#5B7290]', bg: 'bg-[#EEF4FF]', fg: 'text-[#102A43]' },
  Send: { Icon: Send, gradient: 'from-[#0B4DBA] to-[#1677FF]', bg: 'bg-[#E8F1FF]', fg: 'text-[#0B4DBA]' },
  Mail: { Icon: Mail, gradient: 'from-[#16A34A] to-[#0B4DBA]', bg: 'bg-[#E6F7EB]', fg: 'text-[#16A34A]' },
  Sparkles: { Icon: Sparkles, gradient: 'from-[#8B5CF6] to-[#1677FF]', bg: 'bg-[#F0EAFF]', fg: 'text-[#8B5CF6]' },
  LayoutGrid: { Icon: LayoutGrid, gradient: 'from-[#1677FF] to-[#0B4DBA]', bg: 'bg-[#E8F1FF]', fg: 'text-[#1677FF]' },
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
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D6E4FF] bg-white px-3 py-1 text-xs font-semibold text-[#1677FF]">
            <Sparkles className="size-3.5" /> Ангилал
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#102A43]">
            Алдартай <span className="gradient-text">ангиллууд</span>
          </h2>
          <p className="mt-3 text-[#5B7290]">
            Өөрийн хэрэгцээнд тохирох хэрэгслийг сонгож аваарай
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
          {categories.map((c) => {
            const meta = ICONS[c.icon] || ICONS.LayoutGrid
            const { Icon } = meta
            const isActive = active === c.slug
            return (
              <button
                key={c.id}
                onClick={() => handleSelect(c.slug)}
                className={`group relative overflow-hidden rounded-2xl border bg-white p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-premium-lg ${
                  isActive ? 'border-[#1677FF] ring-2 ring-[#1677FF]/15' : 'border-[#D6E4FF] shadow-premium hover:border-[#1677FF]/40'
                }`}
              >
                <div className="absolute -right-6 -top-6 size-20 rounded-full bg-gradient-to-br from-[#1677FF]/5 to-transparent transition-opacity opacity-0 group-hover:opacity-100" />
                <div className={`relative grid size-12 place-items-center rounded-2xl bg-gradient-to-br ${meta.gradient} shadow-premium`}>
                  <Icon className="size-6 text-white" />
                </div>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <h3 className="text-[15px] font-bold text-[#102A43]">{c.name}</h3>
                  <ArrowRight className="size-4 text-[#5B7290] transition-all group-hover:translate-x-1 group-hover:text-[#1677FF]" />
                </div>
                <p className="mt-1 text-xs text-[#5B7290] line-clamp-2">
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
