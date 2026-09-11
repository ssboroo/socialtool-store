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
  { label: 'Хэрхэн ажиллах вэ?', href: '#how' },
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

  const handleNav = (href: string) => {
    setMobileOpen(false)
    if (href === '#products' && query) {
      try {
        sessionStorage.setItem('st-search', query)
      } catch {}
    }
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      sessionStorage.setItem('st-search', query)
    } catch {}
    const el = document.querySelector('#products')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
          ? 'bg-white/80 backdrop-blur-xl border-b border-[#D6E4FF] shadow-premium'
          : 'bg-white/40 backdrop-blur-md border-b border-transparent'
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <button onClick={() => handleNav('#top')} className="shrink-0" aria-label="Нүүр хуудас">
            <Logo />
          </button>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((n) => (
              <button
                key={n.label}
                onClick={() => handleNav(n.href)}
                className="px-3.5 py-2 text-sm font-medium text-[#102A43] hover:text-[#1677FF] rounded-lg hover:bg-[#E8F1FF] transition-colors"
              >
                {n.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Search */}
            <form onSubmit={submitSearch} className="relative hidden md:flex items-center">
              <Search className="pointer-events-none absolute left-3 size-4 text-[#5B7290]" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Хэрэгсэл хайх..."
                className="h-9 w-44 lg:w-56 pl-9 rounded-full bg-white border-[#D6E4FF] focus-visible:border-[#1677FF] focus-visible:ring-[#1677FF]/20"
              />
            </form>
            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="md:hidden grid size-9 place-items-center rounded-full hover:bg-[#E8F1FF] text-[#102A43]"
              aria-label="Хайх"
            >
              <Search className="size-5" />
            </button>

            {/* Cart */}
            <button
              onClick={openCart}
              className="relative grid size-9 place-items-center rounded-full hover:bg-[#E8F1FF] text-[#102A43] transition-colors"
              aria-label="Сагс"
            >
              <ShoppingCart className="size-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid min-size-4.5 place-items-center rounded-full bg-[#1677FF] px-1 text-[10px] font-bold text-white shadow-premium">
                  {count}
                </span>
              )}
            </button>

            {/* Account */}
            {loading ? null : customer ? (
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v) }}
                  className="flex items-center gap-1.5 h-9 px-1.5 sm:px-3 rounded-full text-sm font-medium text-[#102A43] hover:bg-[#E8F1FF] transition-colors"
                  aria-label="Миний бүртгэл"
                >
                  <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-[#1677FF] to-[#0B4DBA] text-white text-[11px] font-bold">
                    {customer.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="hidden sm:inline max-w-[100px] truncate">{customer.name.split(' ')[0]}</span>
                  <ChevronDown className="hidden sm:block size-3.5 text-[#5B7290]" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white border border-[#D6E4FF] shadow-premium-lg overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-[#EEF4FF]">
                      <p className="text-sm font-bold text-[#102A43] truncate">{customer.name}</p>
                      <p className="text-xs text-[#5B7290] truncate">{customer.email}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); openAccount() }}
                      className="w-full px-4 py-2.5 text-left text-sm text-[#102A43] hover:bg-[#E8F1FF] flex items-center gap-2"
                    >
                      <UserIcon className="size-4 text-[#1677FF]" /> Профайл
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); openAccount() }}
                      className="w-full px-4 py-2.5 text-left text-sm text-[#102A43] hover:bg-[#E8F1FF] flex items-center gap-2"
                    >
                      <ShoppingBag className="size-4 text-[#1677FF]" /> Миний захиалга
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleLogout() }}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2 border-t border-[#EEF4FF]"
                    >
                      <LogOut className="size-4" /> Гарах
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-full text-sm font-medium text-[#102A43] hover:bg-[#E8F1FF] transition-colors"
                onClick={() => openAuth('login')}
              >
                Нэвтрэх
              </button>
            )}

            {/* CTA */}
            <Button
              onClick={() => handleNav('#products')}
              className="hidden sm:inline-flex h-9 rounded-full bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white shadow-premium hover:shadow-premium-lg gap-1.5"
            >
              <Zap className="size-4" />
              Хэрэгсэл үзэх
            </Button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden grid size-9 place-items-center rounded-full hover:bg-[#E8F1FF] text-[#102A43]"
              aria-label="Цэс"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile search bar */}
      {searchOpen && (
        <div className="md:hidden border-t border-[#D6E4FF] bg-white px-4 py-3">
          <form onSubmit={submitSearch} className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#5B7290]" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Хэрэгсэл хайх..."
              className="h-10 pl-9 rounded-full bg-[#F5F9FF] border-[#D6E4FF]"
            />
          </form>
        </div>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#D6E4FF] bg-white">
          <nav className="px-4 py-3 flex flex-col">
            {NAV.map((n) => (
              <button
                key={n.label}
                onClick={() => handleNav(n.href)}
                className="px-3 py-2.5 text-left text-sm font-medium text-[#102A43] hover:bg-[#E8F1FF] rounded-lg"
              >
                {n.label}
              </button>
            ))}
            {customer ? (
              <>
                <button
                  onClick={() => { setMobileOpen(false); openAccount() }}
                  className="px-3 py-2.5 text-left text-sm font-medium text-[#102A43] hover:bg-[#E8F1FF] rounded-lg flex items-center gap-2"
                >
                  <UserIcon className="size-4 text-[#1677FF]" /> Миний бүртгэл
                </button>
                <button
                  onClick={() => { setMobileOpen(false); logout() }}
                  className="px-3 py-2.5 text-left text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-2"
                >
                  <LogOut className="size-4" /> Гарах
                </button>
              </>
            ) : (
              <button
                onClick={() => { setMobileOpen(false); openAuth('login') }}
                className="px-3 py-2.5 text-left text-sm font-medium text-[#1677FF] hover:bg-[#E8F1FF] rounded-lg flex items-center gap-2"
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
