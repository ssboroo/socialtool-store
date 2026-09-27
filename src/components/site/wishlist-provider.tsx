'use client'

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { useCustomer } from '@/hooks/use-customer'
import { useUIStore } from '@/store/cart'
import { toast } from 'sonner'

export type SavedProduct = {
  id: string
  savedPrice: number
  priceDropped: boolean
  createdAt: string
  product: {
    id: string; name: string; shortDesc: string; image?: string | null
    category: string; icon: string; price: number; available: boolean
  }
}

type WishlistContextValue = {
  items: SavedProduct[]
  savedIds: string[]
  loading: boolean
  busyId: string | null
  isOpen: boolean
  show: () => void
  close: () => void
  toggle: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

const EMPTY: WishlistContextValue = {
  items: [], savedIds: [], loading: false, busyId: null, isOpen: false,
  show: () => {}, close: () => {}, toggle: async () => {}, refresh: async () => {},
}
const Context = createContext<WishlistContextValue>(EMPTY)
export function useWishlist() { return useContext(Context) }

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { customer } = useCustomer()
  const openAuth = useUIStore(state => state.openAuth)
  const [items, setItems] = useState<SavedProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const refresh = useCallback(async () => {
    if (!customer?.id) { setItems([]); return }
    const response = await fetch('/api/customer/wishlist', { cache: 'no-store' })
    if (!response.ok) throw new Error('Хүслийн жагсаалт ачаалж чадсангүй')
    const data = await response.json()
    if (!Array.isArray(data.items)) throw new Error('Өгөгдөл буруу байна')
    setItems(data.items)
  }, [customer?.id])

  useEffect(() => {
    const controller = new AbortController()
    queueMicrotask(() => {
      if (controller.signal.aborted) return
      setItems([])
      if (!customer?.id) { setLoading(false); return }
      setLoading(true)
      void fetch('/api/customer/wishlist', { signal: controller.signal, cache: 'no-store' })
        .then(async res => { if (!res.ok) throw new Error('Хүслийн жагсаалт ачаалж чадсангүй'); return res.json() })
        .then(data => { if (!controller.signal.aborted && Array.isArray(data.items)) setItems(data.items) })
        .catch(() => { if (!controller.signal.aborted) toast.error('Хадгалсан бараанууд ачаалж чадсангүй') })
        .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    })
    return () => controller.abort()
  }, [customer?.id])

  const toggle = useCallback(async (productId: string) => {
    if (!customer?.id) {
      openAuth('login')
      toast.info('Бараа хадгалахын тулд нэвтэрнэ үү')
      return
    }
    if (busyId) return
    const exists = items.some(row => row.product.id === productId)
    setBusyId(productId)
    try {
      const response = await fetch('/api/customer/wishlist', {
        method: exists ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })
      if (!response.ok) throw new Error((await response.json()).error || 'Хадгалж чадсангүй')
      await refresh()
      toast.success(exists ? 'Хүслийн жагсаалтаас хаслаа' : 'Хүслийн жагсаалтад хадгаллаа')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Алдаа гарлаа')
    } finally { setBusyId(null) }
  }, [busyId, customer?.id, items, openAuth, refresh])

  const value = useMemo<WishlistContextValue>(() => ({
    items, savedIds: items.map(row => row.product.id), loading, busyId,
    isOpen, show: () => setIsOpen(true), close: () => setIsOpen(false), toggle, refresh,
  }), [items, loading, busyId, isOpen, toggle, refresh])
  return <Context.Provider value={value}>{children}</Context.Provider>
}
