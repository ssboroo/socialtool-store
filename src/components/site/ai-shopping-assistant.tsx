'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, Send, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatTugrik } from '@/lib/format'
import { useUIStore } from '@/store/cart'

type Suggested = { id: string; name: string; price: number; category: string; shortDesc: string }
type ChatMessage = { role: 'user' | 'assistant'; text: string; mode?: 'ai' | 'catalog'; products?: Suggested[] }

const STARTERS = ['AI видео хийх хэрэгсэл', 'Canva Pro ямар үнэтэй вэ?', 'Facebook Live хэрэгсэл', 'Яаж захиалах вэ?']

export function AIShoppingAssistant({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [error, setError] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const openProduct = useUIStore(state => state.setSelectedProduct)
  useEffect(() => { if (open) endRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest' }) }, [messages, open])


  const submit = async (override?: string) => {
    const text = (override || input).trim()
    if (!text || busy || text.length > 650) return
    setInput('')
    setError('')
    setBusy(true)
    const history = messages.slice(-4).map(item => ({ role: item.role, text: item.text }))
    setMessages(prev => [...prev, { role: 'user', text }])
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, messages: history }),
      })
      const data = await response.json()
      if (!response.ok) throw Error(data.error || 'Түр холбогдож чадсангүй')
      setMessages(prev => [...prev, {
        role: 'assistant', text: data.answer, mode: data.mode,
        products: Array.isArray(data.products) ? data.products : [],
      }])
    } catch (error) { setError(error instanceof Error ? error.message : 'Алдаа гарлаа') }
    finally { setBusy(false) }
  }

  return <>
    {open && <section role="dialog" aria-modal="false" aria-label="Socialtool худалдааны зөвлөх" className="support-panel flex flex-col overflow-hidden">
      <header className="flex items-center justify-between bg-gradient-to-r from-[#1677FF] to-[#7458E8] px-5 py-4 text-white">
        <div className="flex items-center gap-2"><span className="grid size-10 place-items-center rounded-2xl bg-card/20"><Bot className="size-5" /></span><div><h2 className="text-base font-bold">Худалдааны зөвлөх</h2><p className="text-[11px] text-white/85">Бүтээгдэхүүн хайж, сонгоход тусална</p></div></div>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto bg-muted px-4 py-5">
        {!messages.length && <div className="space-y-3">
          <p className="rounded-2xl rounded-tl-sm border border-border bg-card p-3 text-sm leading-relaxed text-foreground">Сайн байна уу! Та ямар дижитал хэрэгсэл хайж байна вэ? Каталогийн бодит бараа, үнийг олж өгөх боломжтой.</p>
          <div className="flex flex-wrap gap-2">{STARTERS.map(value => <button key={value} type="button" onClick={() => void submit(value)} className="rounded-xl border border-border bg-card px-3 py-2 text-left text-xs font-semibold text-primary hover:bg-accent">{value}</button>)}</div>
        </div>}
        {messages.map((message, index) => <div key={index} className={message.role === 'user' ? 'ml-9 rounded-2xl rounded-tr-sm bg-[#1677FF] p-3 text-sm leading-relaxed text-white' : 'mr-6 rounded-2xl rounded-tl-sm border border-border bg-card p-3 text-sm leading-relaxed text-foreground'}>
          <p className="whitespace-pre-line">{message.text}</p>
          {message.role === 'assistant' && <span className="mt-2 block text-[10px] font-semibold text-muted-foreground">{message.mode === 'ai' ? 'AI тайлбар · бодит каталог' : 'Каталогийн автомат зөвлөмж'}</span>}
          {!!message.products?.length && <div className="mt-3 space-y-2">{message.products.map(product => <button key={product.id} type="button" onClick={() => { openProduct(product.id); onClose() }} className="flex w-full items-start justify-between gap-2 rounded-xl border border-border bg-muted p-2 text-left hover:border-[#1677FF]"><span className="min-w-0"><strong className="block text-xs text-foreground">{product.name}</strong><span className="block text-[11px] text-muted-foreground">{product.category}</span></span><span className="shrink-0 text-xs font-bold text-[#1677FF]">{product.price ? formatTugrik(product.price) : 'Үнэгүй'} <ExternalLink className="inline size-3"/></span></button>)}</div>}
        </div>)}
        {busy && <p className="inline-flex items-center gap-2 rounded-2xl bg-card px-3 py-2 text-xs text-muted-foreground"><Loader2 className="size-4 animate-spin"/> Хариулж байна…</p>}
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div ref={endRef}/>
      </div>
      <footer className="border-t border-border bg-card p-3">
        <form onSubmit={e => { e.preventDefault(); void submit() }} className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} maxLength={650} aria-label="Зөвлөхөөс асуух" placeholder="Асуултаа бичнэ үү…" disabled={busy} className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-muted px-3 text-sm text-foreground outline-none focus:border-[#1677FF]"/>
          <Button type="submit" size="icon" aria-label="Илгээх" disabled={busy || !input.trim()}><Send className="size-4"/></Button>
        </form>
        <p className="mt-2 text-center text-[10px] leading-snug text-muted-foreground">Нууц үг, картын мэдээлэл оруулахгүй. AI идэвхтэй үед асуулт AI үйлчилгээ рүү дамжиж болно.</p>
      </footer>
    </section>}
  </>
}
