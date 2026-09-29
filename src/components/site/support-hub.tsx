'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, MessageCircle, X } from 'lucide-react'
import { useCartStore, useUIStore } from '@/store/cart'
import { AIShoppingAssistant } from './ai-shopping-assistant'
import { LiveChat } from './live-chat'
import { useWishlist } from './wishlist-provider'

export function SupportHub() {
  const [view, setView] = useState<'menu' | 'ai' | 'admin' | null>(null)
  const launcher = useRef<HTMLButtonElement>(null)
  const blocked = useUIStore(s => !!(s.selectedProductId || s.checkoutOpen || s.authOpen || s.accountOpen || s.paymentOrderNumber))
  const cartOpen = useCartStore(s => s.isOpen)
  const wishlist = useWishlist()
  const visible = !blocked && !cartOpen && !wishlist.isOpen
  const close = () => { setView(null); launcher.current?.focus() }
  useEffect(() => {
    const open = () => setView('admin')
    window.addEventListener('st-open-chat', open)
    return () => window.removeEventListener('st-open-chat', open)
  }, [])
  useEffect(() => {
    if (!visible || !view) return
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setView(null); launcher.current?.focus() } }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [visible, view])
  return <div className="support-hub customer-surface" hidden={!visible}>
    <button ref={launcher} type="button" className="support-launcher" aria-expanded={!!view} aria-controls="support-options" onClick={() => view ? close() : setView('menu')}><MessageCircle className="size-5" />Тусламж</button>
    <div id="support-options" hidden={!view}>
      {view && <nav className="support-switch" aria-label="Тусламжийн төрөл">
        <button type="button" aria-pressed={view === 'ai'} onClick={() => setView('ai')}><Bot className="size-4" />AI-аас асуух</button>
        <button type="button" aria-pressed={view === 'admin'} onClick={() => setView('admin')}><MessageCircle className="size-4" />Админтай холбогдох</button>
        <button type="button" aria-label="Тусламж хаах" onClick={close}><X className="size-4" /></button>
      </nav>}
      {view === 'menu' && <section className="support-panel support-welcome" aria-label="Тусламж сонгох"><h2>Танд хэрхэн туслах вэ?</h2><p>Бүтээгдэхүүн сонгох бол AI-аас асуугаарай. Захиалга, төлбөрийн асуудлаар админтай холбогдоорой.</p></section>}
      <AIShoppingAssistant open={visible && view === 'ai'} onClose={close} />
      <LiveChat open={visible && view === 'admin'} />
    </div>
  </div>
}
