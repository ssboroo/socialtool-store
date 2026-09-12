'use client'

import {
  AppWindow, ArrowRight, BarChart3, Briefcase, Cloud, Code2, Facebook, Gamepad2,
  Headphones, Instagram, LayoutGrid, Mail, Monitor, Music2, Package, ShieldCheck,
  Sparkles, Twitter, Video, type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'

type IconMeta = { Icon: LucideIcon; gradient: string }

const ICONS: Record<string, IconMeta> = {
  Facebook: { Icon: Facebook, gradient: 'from-[#1877F2] to-[#0B4DBA]' },
  Instagram: { Icon: Instagram, gradient: 'from-[#E1306C] to-[#F77737]' },
  Twitter: { Icon: Twitter, gradient: 'from-[#102A43] to-[#5B7290]' },
  Music2: { Icon: Music2, gradient: 'from-[#111827] to-[#1677FF]' },
  Headphones: { Icon: Headphones, gradient: 'from-[#7C3AED] to-[#2563EB]' },
  Sparkles: { Icon: Sparkles, gradient: 'from-[#8B5CF6] to-[#1677FF]' },
  AppWindow: { Icon: AppWindow, gradient: 'from-[#0F766E] to-[#0891B2]' },
  ShieldCheck: { Icon: ShieldCheck, gradient: 'from-[#059669] to-[#0B4DBA]' },
  Code2: { Icon: Code2, gradient: 'from-[#2563EB] to-[#7C3AED]' },
  Mail: { Icon: Mail, gradient: 'from-[#EA580C] to-[#DB2777]' },
  Gamepad2: { Icon: Gamepad2, gradient: 'from-[#7C3AED] to-[#1D4ED8]' },
  Cloud: { Icon: Cloud, gradient: 'from-[#0EA5E9] to-[#2563EB]' },
  BarChart3: { Icon: BarChart3, gradient: 'from-[#F59E0B] to-[#EA580C]' },
  Briefcase: { Icon: Briefcase, gradient: 'from-[#334155] to-[#0F766E]' },
  Monitor: { Icon: Monitor, gradient: 'from-[#0284C7] to-[#1D4ED8]' },
  Video: { Icon: Video, gradient: 'from-[#DB2777] to-[#7C3AED]' },
  Package: { Icon: Package, gradient: 'from-[#1677FF] to-[#0B4DBA]' },
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

const GENERIC_ICONS = new Set(['', 'LayoutGrid', 'Package'])

function semanticIconKey(category: Category) {
  const text = `${category.name} ${category.slug}`.toLowerCase()

  if (text.includes('facebook')) return 'Facebook'
  if (text.includes('instagram')) return 'Instagram'
  if (text.includes('twitter') || text.includes('x хэрэгсэл') || category.slug.toLowerCase() === 'x') return 'Twitter'
  if (text.includes('tiktok')) return 'Music2'
  if (text.includes('и-мэйл') || text.includes('email') || text.includes('mail')) return 'Mail'
  if (text.includes('хөгжим') || text.includes('audio') || text.includes('аудио')) return 'Headphones'
  if (text.includes('vpn') || text.includes('аюулгүй') || text.includes('security')) return 'ShieldCheck'
  if (text.includes('код') || text.includes('хөгжүүл') || text.includes('developer') || text.includes('coding')) return 'Code2'
  if (text.includes('gaming') || text.includes('game') || text.includes('network')) return 'Gamepad2'
  if (text.includes('cloud') || text.includes('storage')) return 'Cloud'
  if (text.includes('аналитик') || text.includes('marketing') || text.includes('маркетинг')) return 'BarChart3'
  if (text.includes('office') || text.includes('бүтээмж') || text.includes('productivity')) return 'Briefcase'
  if (text.includes('windows')) return 'Monitor'
  if (text.includes('видео') || text.includes('video') || text.includes('дизайн') || text.includes('design')) return 'Video'
  if (text.includes('программ') || text.includes('software') || text.includes('лиценз')) return 'AppWindow'
  if (text.includes('ai') || text.includes('хиймэл оюун')) return 'Sparkles'
  return 'LayoutGrid'
}

function categoryMeta(category: Category) {
  if (!GENERIC_ICONS.has(category.icon) && ICONS[category.icon]) return ICONS[category.icon]
  return ICONS[semanticIconKey(category)] || ICONS.LayoutGrid
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
            Бүх <span className="gradient-text">ангилал</span>
          </h2>
          <p className="mt-3 text-[#5B7290]">
            Өөрийн хэрэгцээнд тохирох хэрэгслийг сонгож аваарай
          </p>
        </div>

        <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:mt-10 lg:grid-cols-4 lg:gap-5">
          {categories.map((c) => {
            const meta = categoryMeta(c)
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
                  <Icon className="size-5 text-white sm:size-6" strokeWidth={2.1} />
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
