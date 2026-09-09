'use client'

import { useEffect, useState, useCallback } from 'react'

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  telegram: string | null
}

export function useCustomer() {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      setCustomer(data.customer || null)
    } catch {
      setCustomer(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setCustomer(null)
  }, [])

  return { customer, loading, refresh, logout, setCustomer }
}
