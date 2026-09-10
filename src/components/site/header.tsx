'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, Heart, LogOut, Menu, Search, ShoppingBag, ShoppingCart, User as UserIcon, X } from 'lucide-react'
import { Logo } from './logo'
import { Input } from '@/components/ui/input'
import { useCartStore, useUIStore } from '@/store/cart'
import { useCustomer } from '@/hooks/use-customer'
import { cn } from '@/lib/utils'

const NAV = [
  { label: 'Бүтээгдэхүүн', href: '#products' },
  { label: 'Блог', href: '#blog' },
  { label: 'Тусламж', href: '#faq' },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const count = useCartStore((s) => s.count())
  const openCart = useCartStore((s) => s.open)
  const openAuth = useUIStore((s) => s.openAuth)
  const openAccount = useUIStore((s) => s.openAccount)
  const { customer, logout, loading } = useCustomer()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const close = () => setMenuOpen(false)
    if (menuOpen) {
      window.addEventListener('click', close)
      return () => window.removeEventListener('click', close)
    }
  }, [menuOpen])

  const handleNav = (href: string) => {
    setMobileOpen(false)
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    try { sessionStorage.setItem('st-search', query) } catch {}
    window.dispatchEvent(new CustomEvent('st-search', { detail: query }))
    document.querySelector('#products')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleLogout = async () => {
    await logout()
    setMenuOpen(false)
  }

  return (
    <header className={cn(
      'sticky top-0 z-50 w-full border-b transition-all duration-300',
      scrolled ? 'border-[#DFE9F5] bg-white/96 shadow-[0_8px_26px_rgba(15,52,96,.07)] backdrop-blur-xl' : 'border-[#E8EFF8] bg-white/94 backdrop-blur-xl'
    )}>
      <div className="mx-auto flex h-[64px] max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button onClick={() => handleNav('#top')} className="shrink-0" aria-label="Нүүр хуудас">
          <Logo />
        </button>

        <nav className="hidden shrink-0 items-center gap-0.5 lg:ml-4 lg:flex">
          {NAV.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNav(item.href)}
              className={cn(
                'relative rounded-lg px-3 py-2 text-[12px] font-bold text-[#284966] transition hover:bg-[#F4F8FE] hover:text-[#1677FF]',
                item.href === '#products' && 'text-[#1677FF] after:absolute after:inset-x-3 after:-bottom-[14px] after:h-0.5 after:rounded-full after:bg-[#1677FF]'
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <form onSubmit={submitSearch} className="relative hidden min-w-0 flex-1 md:block lg:ml-4">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#6F86A1]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Бүтээгдэхүүн, үйлчилгээ хайх... (жишээ: Facebook, Instagram, AI...)"
            className="h-10 w-full rounded-[10px] border-[#D5E1EF] bg-[#FBFDFF] pl-10 pr-11 text-[12px] shadow-none placeholder:text-[#8BA0B7] focus-visible:border-[#1677FF] focus-visible:ring-[#1677FF]/15"
          />
          <button type="submit" className="absolute right-1 top-1 grid size-8 place-items-center rounded-[8px] bg-[#1677FF] text-white hover:bg-[#0867DF]" aria-label="Хайх">
            <Search className="size-4" />
          </button>
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 md:ml-0">
          <button className="hidden h-10 items-center gap-1.5 rounded-[10px] px-2.5 text-[11px] font-bold text-[#274867] hover:bg-[#F4F8FE] xl:flex" aria-label="Хайртай">
            <Heart className="size-4.5" /> Хайртай
          </button>

          <button onClick={openCart} className="relative flex h-10 items-center gap-1.5 rounded-[10px] px-2.5 text-[11px] font-bold text-[#274867] hover:bg-[#F4F8FE]" aria-label="Сагс">
            <ShoppingCart className="size-4.5" />
            <span className="hidden xl:inline">Сагс</span>
            {count > 0 && <span className="absolute right-0 top-0 grid min-h-4 min-w-4 place-items-center rounded-full bg-[#1677FF] px-1 text-[9px] font-extrabold text-white">{count}</span>}
          </button>

          {!loading && customer ? (
            <div className="relative hidden sm:block">
              <button onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v) }} className="flex h-10 items-center gap-2 rounded-[10px] bg-[#F5F9FF] px-3 text-[11px] font-bold text-[#102A43] hover:bg-[#ECF4FF]">
                <UserIcon className="size-4" />
                <span className="max-w-[110px] truncate">{customer.name.split(' ')[0]}</span>
                <ChevronDown className="size-3.5 text-[#7187A2]" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-[#DCE8FA] bg-white shadow-[0_18px_45px_rgba(15,52,96,.14)]">
                  <div className="border-b border-[#EEF4FB] px-4 py-3">
                    <p className="truncate text-sm font-bold text-[#102A43]">{customer.name}</p>
                    <p className="truncate text-xs text-[#7187A2]">{customer.email}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); openAccount() }} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[#153556] hover:bg-[#F5F9FF]"><UserIcon className="size-4 text-[#1677FF]" /> Миний аккаунт</button>
                  <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); openAccount() }} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[#153556] hover:bg-[#F5F9FF]"><ShoppingBag className="size-4 text-[#1677FF]" /> Миний захиалга</button>
                  <button onClick={(e) => { e.stopPropagation(); handleLogout() }} className="flex w-full items-center gap-2 border-t border-[#EEF4FB] px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50"><LogOut className="size-4" /> Гарах</button>
                </div>
              )}
            </div>
          ) : !loading ? (
            <button onClick={() => openAuth('login')} className="hidden h-10 items-center gap-2 rounded-[10px] bg-[#F5F9FF] px-3.5 text-[11px] font-bold text-[#102A43] hover:bg-[#ECF4FF] sm:flex"><UserIcon className="size-4" /> Миний аккаунт</button>
          ) : null}

          <button onClick={() => setMobileOpen((v) => !v)} className="grid size-10 place-items-center rounded-xl text-[#102A43] hover:bg-[#F5F9FF] lg:hidden" aria-label="Цэс">
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-[#E7EFFB] bg-white px-4 py-4 lg:hidden">
          <form onSubmit={submitSearch} className="relative mb-3 md:hidden">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#7187A2]" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Бүтээгдэхүүн хайх..." className="h-10 rounded-xl bg-[#F8FBFF] pl-10" />
          </form>
          <nav className="grid gap-1">
            {NAV.map((item) => <button key={item.label} onClick={() => handleNav(item.href)} className="rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-[#153556] hover:bg-[#F5F9FF]">{item.label}</button>)}
            {!customer && <button onClick={() => { setMobileOpen(false); openAuth('login') }} className="rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-[#1677FF] hover:bg-[#F5F9FF]">Нэвтрэх / Бүртгүүлэх</button>}
          </nav>
        </div>
      )}
    </header>
  )
}
