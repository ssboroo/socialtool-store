'use client'

import { useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { MessageCircle, Send, Loader2, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Session {
  id: string
  customerName: string
  phone: string | null
  lastMessageAt: string
  messages?: { id: string; sender: string; content: string; createdAt: string }[]
}

export function AdminChat({ token }: { token: string }) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Session | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const load = () => {
    fetch('/api/admin/chat/sessions', { headers: { authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setSessions(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    const sock = io('/?XTransformPort=3003', { transports: ['websocket', 'polling'], reconnection: true })
    socketRef.current = sock
    sock.on('connect', () => {
      setConnected(true)
      sock.emit('chat:join', { role: 'admin' })
    })
    sock.on('disconnect', () => setConnected(false))
    sock.on('chat:message', (msg: { sessionId: string; sender: string; content: string; createdAt: string }) => {
      if (msg.sender === 'customer' && msg.sessionId) {
        setSessions((prev) => {
          const exists = prev.find((s) => s.id === msg.sessionId)
          if (exists) {
            return prev.map((s) => s.id === msg.sessionId ? { ...s, lastMessageAt: msg.createdAt } : s)
          }
          return prev
        })
        if (selectedId === msg.sessionId) {
          setSelected((prev) => prev ? {
            ...prev,
            messages: [...(prev.messages || []), { id: 'm_' + Date.now(), sender: 'customer', content: msg.content, createdAt: msg.createdAt }],
          } : prev)
        }
      }
    })
    return () => { sock.disconnect() }
     
  }, [token])

  useEffect(() => {
    if (!selectedId) return
    fetch(`/api/admin/chat/sessions/${selectedId}`, { headers: { authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setSelected(d))
      .catch(() => {})
  }, [selectedId, token])

  // Poll for new customer messages on the selected session (reliable fallback)
  useEffect(() => {
    if (!selectedId) return
    let stopped = false
    const seenIds = new Set((selected?.messages || []).map((m) => m.id))
    const poll = async () => {
      try {
        const res = await fetch(`/api/admin/chat/sessions/${selectedId}`, { headers: { authorization: `Bearer ${token}` } })
        if (!res.ok) return
        const data = await res.json()
        if (stopped) return
        const incoming = (data.messages || []) as { id: string; sender: string; content: string; createdAt: string }[]
        const newCustomer = incoming.filter((m) => m.sender === 'customer' && !seenIds.has(m.id))
        if (newCustomer.length > 0) {
          newCustomer.forEach((m) => seenIds.add(m.id))
          setSelected((prev) => prev ? {
            ...prev,
            messages: [...(prev.messages || []), ...newCustomer.map((m) => ({ id: m.id, sender: m.sender, content: m.content, createdAt: m.createdAt }))],
          } : prev)
        }
      } catch {}
    }
    const interval = setInterval(poll, 3000)
    return () => { stopped = true; clearInterval(interval) }
     
  }, [selectedId, token])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [selected?.messages])

  const send = () => {
    if (!input.trim() || !selectedId) return
    const content = input.trim()
    const msgId = 'm_' + Date.now()
    const createdAt = new Date().toISOString()
    if (socketRef.current) {
      socketRef.current.emit('chat:message', { sessionId: selectedId, sender: 'admin', content })
    }
    fetch('/api/admin/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ sessionId: selectedId, content }),
    }).catch(() => {})
    setSelected((prev) => prev ? {
      ...prev,
      messages: [...(prev.messages || []), { id: msgId, sender: 'admin', content, createdAt }],
    } : prev)
    setInput('')
  }

  return (
    <div className="grid lg:grid-cols-3 gap-4 h-[600px]">
      {/* sessions list */}
      <div className="rounded-2xl bg-white border border-[#D6E4FF] shadow-premium overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-[#EEF4FF] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#102A43]">Чатын сешн</h3>
          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', connected ? 'bg-[#E6F7EB] text-[#16A34A]' : 'bg-gray-100 text-gray-500')}>
            {connected ? 'Онлайн' : 'Офлайн'}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto custom-scroll divide-y divide-[#EEF4FF]">
          {loading ? (
            <div className="grid place-items-center py-12"><Loader2 className="size-6 animate-spin text-[#1677FF]" /></div>
          ) : sessions.length === 0 ? (
            <div className="py-12 text-center">
              <MessageCircle className="mx-auto size-8 text-[#5B7290]/40" />
              <p className="mt-2 text-xs text-[#5B7290]">Сешн байхгүй</p>
            </div>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={cn('w-full text-left px-4 py-3 hover:bg-[#F5F9FF]/60', selectedId === s.id && 'bg-[#E8F1FF]')}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#102A43]">{s.customerName}</span>
                  <span className="text-[10px] text-[#5B7290]">{new Date(s.lastMessageAt).toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {s.phone && <p className="text-xs text-[#5B7290]">{s.phone}</p>}
              </button>
            ))
          )}
        </div>
      </div>

      {/* chat panel */}
      <div className="lg:col-span-2 rounded-2xl bg-white border border-[#D6E4FF] shadow-premium overflow-hidden flex flex-col">
        {selected ? (
          <>
            <div className="px-4 py-3 border-b border-[#EEF4FF] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#102A43]">{selected.customerName}</h3>
                {selected.phone && <p className="text-xs text-[#5B7290] flex items-center gap-1"><Phone className="size-3" /> {selected.phone}</p>}
              </div>
              <button onClick={load} className="text-xs text-[#1677FF] font-semibold">Сэргээх</button>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scroll p-4 space-y-3 bg-[#F5F9FF]/40">
              {(selected.messages || []).length === 0 ? (
                <p className="text-center text-xs text-[#5B7290] py-8">Мессеж байхгүй</p>
              ) : (
                (selected.messages || []).map((m) => (
                  <div key={m.id} className={cn('flex', m.sender === 'admin' ? 'justify-end' : 'justify-start')}>
                    <div className={cn('max-w-[75%] rounded-2xl px-3.5 py-2 text-sm',
                      m.sender === 'admin'
                        ? 'bg-gradient-to-br from-[#1677FF] to-[#0B4DBA] text-white rounded-br-md'
                        : 'bg-white border border-[#D6E4FF] text-[#102A43] rounded-bl-md')}>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      <p className={cn('mt-1 text-[10px]', m.sender === 'admin' ? 'text-white/70' : 'text-[#5B7290]')}>
                        {new Date(m.createdAt).toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-[#EEF4FF] p-3 flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                rows={1}
                placeholder="Хариулт бичнэ үү..."
                className="flex-1 resize-none max-h-24 rounded-xl border border-[#D6E4FF] bg-[#F5F9FF]/50 px-3 py-2.5 text-sm text-[#102A43] focus:border-[#1677FF] focus:outline-none"
              />
              <Button onClick={send} disabled={!input.trim()} className="h-11 w-11 rounded-xl bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white p-0">
                <Send className="size-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 grid place-items-center">
            <div className="text-center">
              <MessageCircle className="mx-auto size-10 text-[#5B7290]/40" />
              <p className="mt-3 text-sm text-[#5B7290]">Сонгож яриагаа сонгоно уу</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
