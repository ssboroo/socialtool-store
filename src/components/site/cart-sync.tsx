'use client'

import { useEffect, useRef, useState } from 'react'
import { useCustomer } from '@/hooks/use-customer'
import { useCartStore, type CartItem } from '@/store/cart'

export function CartSync() {
  const { customer, loading } = useCustomer()
  const [message, setMessage] = useState('')
  const retryAction = useRef<() => void>(() => {})
  const customerId = customer?.id

  useEffect(() => {
    if (loading) return
    const previous = useCartStore.getState()
    if (!customerId) {
      if (previous.ownerId) useCartStore.setState({ items: [], ownerId: null, syncBusy: false })
      setMessage('')
      return
    }
    const guest = !previous.ownerId ? previous.items : []
    let cancelled = false
    let initialized = false
    let applying = false
    let version = 0
    let dirty = false
    let saving = false
    let failed = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const controller = new AbortController()
    useCartStore.setState({ syncBusy: true })
    setMessage('Сагс ачаалж байна…')

    const load = async (mergeGuest = false, background = false) => {
      const startingItems = useCartStore.getState().items
      const res = await fetch('/api/customer/cart', { cache: 'no-store', signal: controller.signal })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Сагс ачаалж чадсангүй')
      if (cancelled) return
      if (background && (dirty || saving || useCartStore.getState().items !== startingItems)) return
      version = data.version
      const items = [...data.items] as CartItem[]
      if (mergeGuest) for (const item of guest) {
        const match = items.find(i => i.id === item.id)
        if (match) match.quantity = Math.min(99, match.quantity + item.quantity)
        else if (items.length < 100) items.push({ ...item, quantity: Math.min(99, item.quantity) })
      }
      applying = true
      useCartStore.setState({ items, ownerId: customerId, syncBusy: false })
      applying = false
      initialized = true
      setMessage('')
      if (mergeGuest && guest.length) { dirty = true; void save() }
    }

    const save = async () => {
      if (saving || cancelled || !initialized || !dirty) return
      saving = true
      dirty = false
      try {
        const res = await fetch('/api/customer/cart', {
          method: 'PUT', signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ownerId: customerId, version, items: useCartStore.getState().items.map(i => ({ id: i.id, quantity: i.quantity })) }),
        })
        const data = await res.json()
        if (cancelled) return
        if (res.status === 409) {
          dirty = false
          await load()
          setMessage('Сагс өөр төхөөрөмжөөс өөрчлөгдсөн тул шинэчиллээ. Сүүлийн үйлдлээ дахин хийнэ үү.')
        } else if (!res.ok) throw new Error(data.error || 'Сагс хадгалагдсангүй')
        else { version = data.version; failed = false; setMessage('') }
      } catch (e) {
        if (!cancelled) { failed = true; setMessage(e instanceof Error ? e.message : 'Сагс хадгалагдсангүй') }
        // Retain local items; retry only on a new edit or explicit user retry.
      } finally { saving = false }
      if (dirty && !cancelled) void save()
    }
    const unsubscribe = useCartStore.subscribe((state, old) => {
      if (state.items === old.items || applying || !initialized || cancelled) return
      dirty = true
      clearTimeout(timer)
      timer = setTimeout(() => { void save() }, 200)
    })
    retryAction.current = () => {
      if (!initialized) void load(true).catch(e => setMessage(e instanceof Error ? e.message : 'Сагс ачаалж чадсангүй'))
      else if (failed) { dirty = true; void save() }
      else void load().catch(() => setMessage('Сагс шинэчилж чадсангүй'))
    }
    const refresh = () => { if (initialized && !dirty && !saving && !failed) void load(false, true).catch(() => setMessage('Сагс шинэчилж чадсангүй')) }
    window.addEventListener('focus', refresh)
    const interval = setInterval(refresh, 30000)
    void load(true).catch(e => { if (!cancelled) setMessage(e instanceof Error ? e.message : 'Сагс ачаалж чадсангүй') })
    return () => {
      cancelled = true
      controller.abort()
      clearTimeout(timer)
      clearInterval(interval)
      unsubscribe()
      window.removeEventListener('focus', refresh)
      useCartStore.setState({ syncBusy: false })
    }
  }, [customerId, loading])

  if (!customerId || !message) return null
  return <div role="status" className="fixed bottom-3 left-3 z-[80] max-w-sm rounded-xl border bg-white p-3 text-sm shadow-lg">
    {message} {message !== 'Сагс ачаалж байна…' && <button className="ml-2 font-semibold text-blue-600 underline" onClick={() => retryAction.current()}>Дахин оролдох</button>}
  </div>
}
