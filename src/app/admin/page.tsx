'use client'

import { useEffect, useState } from 'react'
import { AdminLogin } from '@/components/admin/login'
import { AdminOverview } from '@/components/admin/overview'
import { AdminOrders } from '@/components/admin/orders'
import { AdminProducts } from '@/components/admin/products'
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
  Tag, Star, HelpCircle, Gift, Users, Settings,
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
  | 'overview' | 'orders' | 'products' | 'categories'
  | 'reviews' | 'faqs' | 'promotions' | 'customers'
  | 'chat' | 'settings'

const TABS: { id: TabId; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Тойм', Icon: LayoutDashboard },
  { id: 'orders', label: 'Захиалга', Icon: ShoppingBag },
  { id: 'products', label: 'Бүтээгдэхүүн', Icon: Package },
  { id: 'categories', label: 'Ангилал', Icon: Tag },
  { id: 'promotions', label: 'Хямдрал', Icon: Gift },
  { id: 'reviews', label: 'Сэтгэгдэл', Icon: Star },
  { id: 'faqs', label: 'Асуулт', Icon: HelpCircle },
  { id: 'customers', label: 'Хэрэглэгчид', Icon: Users },
  { id: 'chat', label: 'Чат', Icon: MessageCircle },
  { id: 'settings', label: 'Тохиргоо', Icon: Settings },
]

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null)
  const [tab, setTab] = useState<TabId>('overview')
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('admin_token')
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToken(stored)
    }
  }, [])

  useEffect(() => {
    if (!token) return
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [token])

  const handleLogin = (t: string) => {
    localStorage.setItem('admin_token', t)
    setToken(t)
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    setToken(null)
    toast.success('Гарлаа')
  }

  if (!token) return <AdminLogin onLogin={handleLogin} />

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#D6E4FF]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#E8F1FF] px-2.5 py-1 text-[11px] font-bold text-[#0B4DBA]">
              Админ
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" target="_blank" className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#D6E4FF] bg-white px-3.5 py-2 text-xs font-semibold text-[#102A43] hover:bg-[#E8F1FF]">
              <ExternalLink className="size-3.5" /> Сайтыг үзэх
            </a>
            <Button onClick={logout} variant="outline" className="rounded-full border-[#D6E4FF] text-[#5B7290] hover:text-red-500 hover:border-red-200 gap-1.5">
              <LogOut className="size-4" /> Гарах
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col">
        {/* tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto custom-scroll pb-1">
          {TABS.map((t) => {
            const { Icon } = t
            return (
              <button
                key={t.id}
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
          {tab === 'products' && <AdminProducts token={token} categories={categories} />}
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 text-center text-xs text-[#5B7290]">
          © 2026 SOCIALTOOL.STORE · Админ удирдлагын самбар
        </div>
      </footer>
    </div>
  )
}
