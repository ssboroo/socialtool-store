'use client'

import { useEffect, useCallback } from 'react'
import { create } from 'zustand'

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  telegram: string | null
}

// All header, checkout and account views share the same authenticated customer.
const useCustomerState = create<{
  customer: Customer | null
  loading: boolean
  setCustomer: (customer: Customer | null) => void
}>((set) => ({
  customer: null,
  loading: true,
  setCustomer: (customer) => { revision++; set({ customer, loading: false }) },
}))
let revision = 0
let pending: Promise<void> | null = null

async function refreshCustomer() {
  if (pending) return pending
  const started = revision
  pending = (async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' })
      if (!res.ok) throw new Error('Session unavailable')
      const data = await res.json()
      if (started === revision) useCustomerState.setState({ customer: data.customer || null, loading: false })
    } catch {
      if (started === revision) useCustomerState.setState({ loading: false })
    } finally { pending = null }
  })()
  return pending
}

export function useCustomer() {
  const { customer, loading, setCustomer } = useCustomerState()
  const refresh = useCallback(refreshCustomer, [])
  useEffect(() => { void refresh() }, [refresh])
  const logout = useCallback(async () => {
    const res = await fetch('/api/auth/logout', { method: 'POST' })
    if (!res.ok) throw new Error('Гарахад алдаа гарлаа')
    useCustomerState.getState().setCustomer(null)
  }, [])
  return { customer, loading, refresh, logout, setCustomer }
}
