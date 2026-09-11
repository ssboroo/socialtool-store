'use client'

import { Logo } from './logo'
import { Mail, Send, ShieldCheck, Zap } from 'lucide-react'

const LINKS = [
  { label: 'Нүүр', href: '#top' },
  { label: 'Бүх хэрэгсэл', href: '#products' },
  { label: 'Ангилал', href: '#categories' },
  { label: 'Хэрхэн ажиллах вэ?', href: '#how' },
  { label: 'Тусламж', href: '#faq' },
]

function scrollTo(href: string) {
  document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function Footer({ settings }: { settings?: Record<string, string> }) {
  const contactEmail = settings?.contactEmail || 'help@socialtool.store'
  const contactTelegram = settings?.contactTelegram || 'socialtool'
  const footerDescription = settings?.footerDescription || 'SOCIALTOOL.STORE — Social media & AI хэрэгслүүд нэг дор. Монгол хэрэглэгчдэд зориулсан аюулгүй, шуурхай, баталгаатай дижитал хэрэгсэл.'
  const footerCopyright = settings?.footerCopyright || '© 2026 SOCIALTOOL.STORE. Бүх эрх хуулиар хамгаалагдсан.'

  return (
    <footer className="relative mt-auto border-t border-[#D6E4FF] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-9 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5">
            <button type="button" onClick={() => scrollTo('#top')} aria-label="Нүүр хуудас руу очих" className="rounded-xl text-left">
              <Logo />
            </button>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#5B7290]">
              {footerDescription}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F1FF] px-3 py-1.5 text-xs font-semibold text-[#0B4DBA]">
                <ShieldCheck className="size-3.5" /> Wire.mn төлбөр
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F7EB] px-3 py-1.5 text-xs font-semibold text-[#16A34A]">
                <Zap className="size-3.5" /> Шууд хүргэлт
              </span>
            </div>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-sm font-bold text-[#102A43]">Холбоосууд</h4>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 md:grid-cols-1">
              {LINKS.map((l) => (
                <li key={l.label}>
                  <button
                    type="button"
                    onClick={() => scrollTo(l.href)}
                    className="rounded-md text-left text-sm text-[#5B7290] transition-colors hover:text-[#1677FF]"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <h4 className="text-sm font-bold text-[#102A43]">Холбогдох</h4>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href={`mailto:${contactEmail}`}
                  className="group flex items-center gap-3 rounded-xl text-sm text-[#5B7290] transition-colors hover:text-[#1677FF]"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#E8F1FF] transition-colors group-hover:bg-[#1677FF] group-hover:text-white">
                    <Mail className="size-4" />
                  </span>
                  <span className="break-all">{contactEmail}</span>
                </a>
              </li>
              <li>
                <a
                  href={`https://t.me/${contactTelegram.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-xl text-sm text-[#5B7290] transition-colors hover:text-[#1677FF]"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#E8F1FF] transition-colors group-hover:bg-[#1677FF] group-hover:text-white">
                    <Send className="size-4" />
                  </span>
                  @{contactTelegram.replace(/^@/, '')}
                </a>
              </li>
            </ul>
            <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#D6E4FF] bg-[#F5F9FF] px-3 py-2 text-xs text-[#5B7290]">
              <span className="size-2 rounded-full bg-[#16A34A] animate-pulse" />
              24/7 туслах баг бэлэн байна
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-[#EEF4FF] pt-6 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-[#5B7290]">
            {footerCopyright}
          </p>
          <p className="text-xs text-[#5B7290]">
            Made with <span className="text-[#1677FF]">♥</span> in Mongolia
          </p>
        </div>
      </div>
    </footer>
  )
}
