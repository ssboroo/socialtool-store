'use client'

import { useEffect, useState } from 'react'
import { AdminLogin } from '@/components/admin/login'
import { AdminOverview } from '@/components/admin/overview'
import { AdminOrders } from '@/components/admin/orders'
import { AdminProducts } from '@/components/admin/products'
import { ProductAdminTools } from '@/components/admin/product-admin-tools'
import { SupplierCatalog } from '@/components/admin/supplier-catalog'
import { SupplierFeedCard } from '@/components/admin/supplier-feed-card'
import { G2ASyncCard } from '@/components/admin/g2a-sync-card'
import { AdminCategories } from '@/components/admin/categories'
import { AdminReviews } from '@/components/admin/reviews'
import { AdminFaqs } from '@/components/admin/faqs'
import { AdminPromotions } from '@/components/admin/promotions'
import { AdminCustomers } from '@/components/admin/customers'
import { AdminSettings } from '@/components/admin/settings'
import { AdminChat } from '@/components/admin/chat'
import { Logo } from '@/components/site/logo'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard, ShoppingBag, Package, MessageCircle, LogOut, ExternalLink,
  Tag, Star, HelpCircle, Gift, Users, Settings, Database,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
  slug: string
  icon: string
}

type TabId =
  | 'overview' | 'orders' | 'products' | 'suppliers' | 'categories'
  | 'reviews' | 'faqs' | 'promotions' | 'customers'
  | 'chat' | 'settings'

const TABS: { id: TabId; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Тойм', Icon: LayoutDashboard },
  { id: 'orders', label: 'Захиалга', Icon: ShoppingBag },
  { id: 'products', label: 'Бүтээгдэхүүн', Icon: Package },
  { id: 'suppliers', label: 'Нийлүүлэгч', Icon: Database },
  { id: 'categories', label: 'Ангилал', Icon: Tag },
  { id: 'promotions', label: 'Хямдрал', Icon: Gift },
  { id: 'reviews', label: 'Сэтгэгдэл', Icon: Star },
  { id: 'faqs', label: 'Асуулт', Icon: HelpCircle },
  { id: 'customers', label: 'Хэрэглэгчид', Icon: Users },
  { id: 'chat', label: 'Чат', Icon: MessageCircle },
  { id: 'settings', label: 'Тохиргоо', Icon: Settings },
]

const COOKIE_SESSION = 'cookie-session'

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [tab, setTab] = useState<TabId>('overview')
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    fetch('/api/admin/session', { cache: 'no-store' })
      .then((res) => {
        if (res.ok) setToken(COOKIE_SESSION)
      })
      .catch(() => {})
      .finally(() => setSessionChecked(true))
  }, [])

  useEffect(() => {
    if (!token) return
    fetch('/api/categories', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [token, tab])

  const handleLogin = (_token: string) => {
    setToken(COOKIE_SESSION)
    setSessionChecked(true)
  }

  const logout = async () => {
    const res = await fetch('/api/admin/session', { method: 'DELETE' })
    if (!res.ok) { toast.error('Гарахад алдаа гарлаа'); return }
    setToken(null)
    toast.success('Гарлаа')
  }

  if (!sessionChecked) {
    return <div className="min-h-screen grid place-items-center bg-[#F5F9FF] text-sm font-semibold text-[#5B7290]">Админ эрх шалгаж байна…</div>
  }
  if (!token) return <AdminLogin onLogin={handleLogin} />

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#D6E4FF]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#E8F1FF] px-2.5 py-1 text-[11px] font-bold text-[#0B4DBA]">Админ</span>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" target="_blank" rel="noopener noreferrer" className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#D6E4FF] bg-white px-3.5 py-2 text-xs font-semibold text-[#102A43] hover:bg-[#E8F1FF]">
              <ExternalLink className="size-3.5" /> Сайтыг үзэх
            </a>
            <Button onClick={logout} variant="outline" className="rounded-full border-[#D6E4FF] text-[#5B7290] hover:text-red-500 hover:border-red-200 gap-1.5">
              <LogOut className="size-4" /> Гарах
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col">
        <div className="mb-6 flex gap-2 overflow-x-auto custom-scroll pb-1" role="tablist" aria-label="Админ цэс">
          {TABS.map((t) => {
            const { Icon } = t
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all',
                  tab === t.id
                    ? 'bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white shadow-premium'
                    : 'bg-white border border-[#D6E4FF] text-[#102A43] hover:bg-[#E8F1FF]'
                )}
              >
                <Icon className="size-4" />
                {t.label}
              </button>
            )
          })}
        </div>

        <div className="flex-1">
          {tab === 'overview' && <AdminOverview token={token} />}
          {tab === 'orders' && <AdminOrders token={token} />}
          {tab === 'products' && <><ProductAdminTools token={token} categories={categories} /><AdminProducts token={token} categories={categories} /></>}
          {tab === 'suppliers' && <><SupplierFeedCard /><G2ASyncCard /><SupplierCatalog /></>}
          {tab === 'categories' && <AdminCategories token={token} />}
          {tab === 'promotions' && <AdminPromotions token={token} />}
          {tab === 'reviews' && <AdminReviews token={token} />}
          {tab === 'faqs' && <AdminFaqs token={token} />}
          {tab === 'customers' && <AdminCustomers token={token} />}
          {tab === 'chat' && <AdminChat token={token} />}
          {tab === 'settings' && <AdminSettings token={token} />}
        </div>
      </div>

      <footer className="mt-auto border-t border-[#D6E4FF] bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 text-center text-xs text-[#5B7290]">© 2026 SOCIALTOOL.STORE · Админ удирдлагын самбар</div>
      </footer>
    </div>
  )
}
