'use client'

import { useEffect, useState } from 'react'
import { Search, ShoppingCart, Menu, X, ChevronDown, Zap, User as UserIcon, LogOut, ShoppingBag } from 'lucide-react'
import { Logo } from './logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCartStore, useUIStore } from '@/store/cart'
import { useCustomer } from '@/hooks/use-customer'
import { cn } from '@/lib/utils'

const NAV = [
  { label: 'Нүүр', href: '#top' },
  { label: 'Бүх хэрэгсэл', href: '#products' },
  { label: 'Ангилал', href: '#categories' },
  { label: 'Хэрхэн захиалах вэ?', href: '#how' },
  { label: 'Тусламж', href: '#faq' },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const count = useCartStore((s) => s.count())
  const openCart = useCartStore((s) => s.open)
  const openAuth = useUIStore((s) => s.openAuth)
  const openAccount = useUIStore((s) => s.openAccount)
  const { customer, logout, loading } = useCustomer()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
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

  const sendSearch = () => {
    const value = query.trim()
    try {
      if (value) sessionStorage.setItem('st-search', value)
      else sessionStorage.removeItem('st-search')
    } catch {}
    window.dispatchEvent(new CustomEvent('st-search', { detail: value }))
  }

  const handleNav = (href: string) => {
    setMobileOpen(false)
    if (href === '#products' && query.trim()) sendSearch()
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    sendSearch()
    document.querySelector('#products')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setSearchOpen(false)
  }

  const handleLogout = async () => {
    await logout()
    setMenuOpen(false)
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        scrolled
          ? 'border-b border-[#D6E4FF] bg-white/90 shadow-premium backdrop-blur-xl'
          : 'border-b border-transparent bg-white/45 backdrop-blur-md'
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3 sm:gap-4">
          <button type="button" onClick={() => handleNav('#top')} className="shrink-0 rounded-xl" aria-label="Нүүр хуудас">
            <Logo />
          </button>

          <nav className="hidden items-center gap-1 xl:flex" aria-label="Үндсэн цэс">
            {NAV.map((n) => (
              <button
                type="button"
                key={n.label}
                onClick={() => handleNav(n.href)}
                className="whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium text-[#102A43] transition-colors hover:bg-[#E8F1FF] hover:text-[#1677FF]"
              >
                {n.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <form onSubmit={submitSearch} className="relative hidden items-center md:flex">
              <Search className="pointer-events-none absolute left-3 size-4 text-[#5B7290]" />
              <Input
                aria-label="Хэрэгсэл хайх"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Хэрэгсэл хайх..."
                className="h-9 w-44 rounded-full border-[#D6E4FF] bg-white pl-9 shadow-sm focus-visible:border-[#1677FF] focus-visible:ring-[#1677FF]/20 xl:w-44"
              />
            </form>

            <button
              type="button"
              onClick={() => {
                setSearchOpen((v) => !v)
                setMobileOpen(false)
              }}
              className="grid size-9 place-items-center rounded-full text-[#102A43] transition-colors hover:bg-[#E8F1FF] md:hidden"
              aria-label="Хайх"
              aria-expanded={searchOpen}
            >
              <Search className="size-5" />
            </button>

            <button
              type="button"
              onClick={openCart}
              className="relative grid size-9 place-items-center rounded-full text-[#102A43] transition-colors hover:bg-[#E8F1FF]"
              aria-label={`Сагс${count > 0 ? `, ${count} бүтээгдэхүүн` : ''}`}
            >
              <ShoppingCart className="size-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-[#1677FF] px-1 text-[10px] font-bold leading-[18px] text-white shadow-premium">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>

            {loading ? null : customer ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v) }}
                  className="flex h-9 items-center gap-1.5 rounded-full px-1.5 text-sm font-medium text-[#102A43] transition-colors hover:bg-[#E8F1FF] sm:px-3"
                  aria-label="Миний бүртгэл"
                  aria-expanded={menuOpen}
                >
                  <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-[#1677FF] to-[#0B4DBA] text-[11px] font-bold text-white">
                    {customer.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="hidden max-w-[100px] truncate sm:inline">{customer.name.split(' ')[0]}</span>
                  <ChevronDown className={cn('hidden size-3.5 text-[#5B7290] transition-transform sm:block', menuOpen && 'rotate-180')} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-[#D6E4FF] bg-white shadow-premium-lg">
                    <div className="border-b border-[#EEF4FF] px-4 py-3">
                      <p className="truncate text-sm font-bold text-[#102A43]">{customer.name}</p>
                      <p className="truncate text-xs text-[#5B7290]">{customer.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); openAccount() }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[#102A43] hover:bg-[#E8F1FF]"
                    >
                      <UserIcon className="size-4 text-[#1677FF]" /> Профайл
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); openAccount() }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[#102A43] hover:bg-[#E8F1FF]"
                    >
                      <ShoppingBag className="size-4 text-[#1677FF]" /> Миний захиалга
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleLogout() }}
                      className="flex w-full items-center gap-2 border-t border-[#EEF4FF] px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50"
                    >
                      <LogOut className="size-4" /> Гарах
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="hidden h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-[#102A43] transition-colors hover:bg-[#E8F1FF] sm:flex"
                onClick={() => openAuth('login')}
              >
                Нэвтрэх
              </button>
            )}

            <Button
              onClick={() => handleNav('#products')}
              className="hidden h-9 gap-1.5 rounded-full bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white shadow-premium transition-shadow hover:shadow-premium-lg 2xl:inline-flex"
            >
              <Zap className="size-4" />
              Хэрэгсэл үзэх
            </Button>

            <button
              type="button"
              onClick={() => {
                setMobileOpen((v) => !v)
                setSearchOpen(false)
              }}
              className="grid size-9 place-items-center rounded-full text-[#102A43] transition-colors hover:bg-[#E8F1FF] xl:hidden"
              aria-label="Цэс"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-[#D6E4FF] bg-white/95 px-4 py-3 shadow-sm backdrop-blur md:hidden">
          <form onSubmit={submitSearch} className="relative mx-auto max-w-7xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5B7290]" />
            <Input
              autoFocus
              aria-label="Хэрэгсэл хайх"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Хэрэгсэл хайх..."
              className="h-10 rounded-full border-[#D6E4FF] bg-[#F5F9FF] pl-9"
            />
          </form>
        </div>
      )}

      {mobileOpen && (
        <div className="border-t border-[#D6E4FF] bg-white/98 shadow-premium xl:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3" aria-label="Гар утасны цэс">
            {NAV.map((n) => (
              <button
                type="button"
                key={n.label}
                onClick={() => handleNav(n.href)}
                className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[#102A43] hover:bg-[#E8F1FF]"
              >
                {n.label}
              </button>
            ))}
            {customer ? (
              <>
                <button
                  type="button"
                  onClick={() => { setMobileOpen(false); openAccount() }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[#102A43] hover:bg-[#E8F1FF]"
                >
                  <UserIcon className="size-4 text-[#1677FF]" /> Миний бүртгэл
                </button>
                <button
                  type="button"
                  onClick={() => { setMobileOpen(false); logout() }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-500 hover:bg-red-50"
                >
                  <LogOut className="size-4" /> Гарах
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => { setMobileOpen(false); openAuth('login') }}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[#1677FF] hover:bg-[#E8F1FF]"
              >
                <UserIcon className="size-4" /> Нэвтрэх / Бүртгүүлэх
              </button>
            )}
            <Button
              onClick={() => {
                setMobileOpen(false)
                handleNav('#products')
              }}
              className="mt-2 h-10 rounded-xl bg-gradient-to-r from-[#1677FF] to-[#0B4DBA]"
            >
              Хэрэгсэл үзэх
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
