'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, Send, X, Sparkles, ExternalLink, MessageCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatTugrik } from '@/lib/format'
import { useUIStore } from '@/store/cart'

type Suggested = { id: string; name: string; price: number; category: string; shortDesc: string }
type ChatMessage = { role: 'user' | 'assistant'; text: string; mode?: 'ai' | 'catalog'; products?: Suggested[] }

const STARTERS = ['AI видео хийх хэрэгсэл', 'Canva Pro ямар үнэтэй вэ?', 'Facebook Live хэрэгсэл', 'Яаж захиалах вэ?']

export function AIShoppingAssistant() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [error, setError] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const openProduct = useUIStore(state => state.setSelectedProduct)
  useEffect(() => { if (open) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) }, [messages, open])
  useEffect(() => {
    if (!open) return
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [open])

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

  const contactAdmin = () => { setOpen(false); window.dispatchEvent(new Event('st-open-chat')) }
  return <>
    <button type="button" onClick={() => setOpen(value => !value)} aria-label="AI худалдааны зөвлөх" aria-expanded={open}
      className="fixed bottom-5 left-4 z-[65] flex items-center gap-2 rounded-full border border-white/70 bg-gradient-to-br from-[#1677FF] to-[#7255E8] px-4 py-3 font-bold text-white shadow-[0_12px_38px_rgba(37,99,235,.32)] transition-all hover:-translate-y-1 motion-reduce:transform-none sm:bottom-7 sm:left-7">
      {open ? <X className="size-5" /> : <Sparkles className="size-5" />}<span className="hidden text-sm sm:inline">{open ? 'Хаах' : 'AI зөвлөх'}</span>
    </button>
    {open && <section role="dialog" aria-modal="false" aria-label="Socialtool худалдааны зөвлөх" className="fixed bottom-[78px] left-3 z-[65] flex h-[min(66vh,570px)] w-[min(calc(100vw-24px),392px)] flex-col overflow-hidden rounded-[26px] border border-[#D6E4FF] bg-white shadow-[0_25px_75px_rgba(16,42,67,.28)] sm:bottom-24 sm:left-7">
      <header className="flex items-center justify-between bg-gradient-to-r from-[#1677FF] to-[#7458E8] px-5 py-4 text-white">
        <div className="flex items-center gap-2"><span className="grid size-10 place-items-center rounded-2xl bg-white/20"><Bot className="size-5" /></span><div><h2 className="text-base font-bold">Худалдааны зөвлөх</h2><p className="text-[11px] text-white/85">Бүтээгдэхүүн хайж, сонгоход тусална</p></div></div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Хаах" className="rounded-full p-2 hover:bg-white/20"><X className="size-5"/></button>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto bg-[#F7FAFF] px-4 py-5">
        {!messages.length && <div className="space-y-3">
          <p className="rounded-2xl rounded-tl-sm border border-[#E7EEFF] bg-white p-3 text-sm leading-relaxed text-[#102A43]">Сайн байна уу! Та ямар дижитал хэрэгсэл хайж байна вэ? Каталогийн бодит бараа, үнийг олж өгөх боломжтой.</p>
          <div className="flex flex-wrap gap-2">{STARTERS.map(value => <button key={value} type="button" onClick={() => void submit(value)} className="rounded-xl border border-[#D6E4FF] bg-white px-3 py-2 text-left text-xs font-semibold text-[#0B4DBA] hover:bg-[#E8F1FF]">{value}</button>)}</div>
        </div>}
        {messages.map((message, index) => <div key={index} className={message.role === 'user' ? 'ml-9 rounded-2xl rounded-tr-sm bg-[#1677FF] p-3 text-sm leading-relaxed text-white' : 'mr-6 rounded-2xl rounded-tl-sm border border-[#E7EEFF] bg-white p-3 text-sm leading-relaxed text-[#102A43]'}>
          <p className="whitespace-pre-line">{message.text}</p>
          {message.role === 'assistant' && <span className="mt-2 block text-[10px] font-semibold text-[#5B7290]">{message.mode === 'ai' ? 'AI тайлбар · бодит каталог' : 'Каталогийн автомат зөвлөмж'}</span>}
          {!!message.products?.length && <div className="mt-3 space-y-2">{message.products.map(product => <button key={product.id} type="button" onClick={() => { openProduct(product.id); setOpen(false) }} className="flex w-full items-start justify-between gap-2 rounded-xl border border-[#D6E4FF] bg-[#F7FAFF] p-2 text-left hover:border-[#1677FF]"><span className="min-w-0"><strong className="block text-xs text-[#102A43]">{product.name}</strong><span className="block text-[11px] text-[#5B7290]">{product.category}</span></span><span className="shrink-0 text-xs font-bold text-[#1677FF]">{product.price ? formatTugrik(product.price) : 'Үнэгүй'} <ExternalLink className="inline size-3"/></span></button>)}</div>}
        </div>)}
        {busy && <p className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs text-[#5B7290]"><Loader2 className="size-4 animate-spin"/> Хариулж байна…</p>}
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div ref={endRef}/>
      </div>
      <footer className="border-t border-[#EEF4FF] bg-white p-3">
        <form onSubmit={e => { e.preventDefault(); void submit() }} className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} maxLength={650} aria-label="Зөвлөхөөс асуух" placeholder="Асуултаа бичнэ үү…" disabled={busy} className="h-11 min-w-0 flex-1 rounded-xl border border-[#D6E4FF] bg-[#F7FAFF] px-3 text-sm text-[#102A43] outline-none focus:border-[#1677FF]"/>
          <Button type="submit" size="icon" aria-label="Илгээх" disabled={busy || !input.trim()}><Send className="size-4"/></Button>
        </form>
        <button type="button" onClick={contactAdmin} className="mt-2 flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-[#0B4DBA] hover:underline"><MessageCircle className="size-3.5"/> Админтай холбогдох</button>
        <p className="mt-2 text-center text-[10px] leading-snug text-[#5B7290]">Нууц үг, картын мэдээлэл оруулахгүй. AI идэвхтэй үед асуулт AI үйлчилгээ рүү дамжиж болно.</p>
      </footer>
    </section>}
  </>
}
