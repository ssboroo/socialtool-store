import { cartKey, type LicenseTerm } from '@/lib/license'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  name: string
  price: number
  icon: string
  category: string
  duration?: LicenseTerm
  quantity: number
}

interface CartState {
  ownerId: string | null
  syncBusy: boolean
  items: CartItem[]
  isOpen: boolean
  add: (item: Omit<CartItem, 'quantity'>, qty?: number) => void
  remove: (id: string) => void
  setQty: (id: string, qty: number) => void
  clear: () => void
  open: () => void
  close: () => void
  toggle: () => void
  total: () => number
  count: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      ownerId: null,
      syncBusy: false,
      items: [],
      isOpen: false,
      add: (item, qty = 1) =>
        set((s) => {
          if (s.syncBusy) return s
          const existing = s.items.find((i) => cartKey(i) === cartKey(item))
          if (existing) {
            return {
              items: s.items.map((i) =>
                cartKey(i) === cartKey(item) ? { ...i, quantity: Math.min(99, i.quantity + qty) } : i
              ),
              isOpen: true,
            }
          }
          return { items: [...s.items, { ...item, quantity: qty }], isOpen: true }
        }),
      remove: (id) => { if (!get().syncBusy) set((s) => ({ items: s.items.filter((i) => cartKey(i) !== id) })) },
      setQty: (id, qty) =>
        set((s) => s.syncBusy ? s : ({
          items:
            qty <= 0
              ? s.items.filter((i) => cartKey(i) !== id)
              : s.items.map((i) => (cartKey(i) === id ? { ...i, quantity: Math.min(99, qty) } : i)),
        })),
      clear: () => set({ items: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'socialtool-cart', partialize: (s) => ({ items: s.items, ownerId: s.ownerId }) }
  )
)

interface UIState {
  selectedProductId: string | null
  checkoutOpen: boolean
  paymentOrderNumber: string | null
  authOpen: boolean
  authMode: 'login' | 'register'
  accountOpen: boolean
  setSelectedProduct: (id: string | null) => void
  openCheckout: () => void
  closeCheckout: () => void
  setPaymentOrder: (orderNumber: string | null) => void
  openAuth: (mode?: 'login' | 'register') => void
  closeAuth: () => void
  openAccount: () => void
  closeAccount: () => void
}

export const useUIStore = create<UIState>((set) => ({
  selectedProductId: null,
  checkoutOpen: false,
  paymentOrderNumber: null,
  authOpen: false,
  authMode: 'login',
  accountOpen: false,
  setSelectedProduct: (id) => set({ selectedProductId: id }),
  openCheckout: () => set({ checkoutOpen: true }),
  closeCheckout: () => set({ checkoutOpen: false }),
  setPaymentOrder: (orderNumber) => set({ paymentOrderNumber: orderNumber }),
  openAuth: (mode = 'login') => set({ authOpen: true, authMode: mode }),
  closeAuth: () => set({ authOpen: false }),
  openAccount: () => set({ accountOpen: true }),
  closeAccount: () => set({ accountOpen: false }),
}))
