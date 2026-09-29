'use client'
import { useCustomer } from '@/hooks/use-customer'
import { rememberChat, savedChats } from '@/lib/chat-history'

import { useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { MessageCircle, Send, Phone, User, Loader2, Sparkles, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { telegramUsername, telegramUrl } from '@/lib/public-contact'
import { toast } from 'sonner'

interface ChatMsg {
  id: string
  sender: 'customer' | 'admin' | 'system'
  content: string
  createdAt: string
}

type ChatVisibility = { open: boolean }

export function LiveChat(props: ChatVisibility) {
  const { customer, loading } = useCustomer()
  if (loading) return null
  return <ChatPanel key={customer?.id || 'guest'} {...props} />
}

function ChatPanel({ open }: ChatVisibility) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [registered, setRegistered] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const active = useRef(true)
  const socketRef = useRef<Socket | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const restore = (id: string) => {
      if (!/^[a-zA-Z0-9_-]{10,100}$/.test(id)) return
      rememberChat(id)
      socketRef.current?.disconnect()
      setSessionId(id)
      setRegistered(true)
      setMessages([])
    }
    try { const id = sessionStorage.getItem('st-order-chat') || savedChats()[0]; if (id) restore(id) } catch {}
    const change = (event: Event) => { const id = (event as CustomEvent).detail; if (typeof id === 'string') restore(id) }
    window.addEventListener('st-chat-session', change)
    return () => window.removeEventListener('st-chat-session', change)
  }, [])

  // auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, open])

  // Poll for new admin messages (reliable fallback when socket.io isn't connected)
  useEffect(() => {
    if (!registered || !sessionId) return
    let stopped = false
    const seen = new Set(messages.map((m) => m.id))
    let initial = true
    const poll = async () => {
      try {
        const res = await fetch(`/api/chat/sessions/${sessionId}`)
        if (!res.ok) return
        const data = await res.json()
        if (stopped) return
        const newMsgs = (data.messages || []).filter((m: ChatMsg) => !seen.has(m.id) && (initial || m.sender !== 'customer'))
        initial = false
        if (newMsgs.length > 0) {
          newMsgs.forEach((m: ChatMsg) => seen.add(m.id))
          setMessages(prev => [...prev, ...newMsgs.filter((m: ChatMsg) => !prev.some(p => p.id === m.id))])
        }
      } catch {}
    }
    poll()
    const interval = setInterval(poll, 3000)
    return () => { stopped = true; clearInterval(interval) }
     
  }, [registered, sessionId])

  const register = async () => {
    if (!name.trim()) {
      toast.error('Нэр оруулна уу')
      return
    }
    setConnecting(true)
    try {
      // create chat session
      const res = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: name.trim(), phone: phone.trim() || null }),
      })
      const data = await res.json()
      if (!active.current) return
      if (!res.ok) throw new Error(data.error || 'Чат эхлүүлж чадсангүй')
      rememberChat(data.sessionId)
      setSessionId(data.sessionId)
      setRegistered(true)
      setMessages([
        {
          id: 'welcome',
          sender: 'admin',
          content: `Сайн байна уу, ${name.trim()}! SOCIALTOOL.STORE-н тусламжийн баг. Танд хэрхэн туслах вэ? 😊`,
          createdAt: new Date().toISOString(),
        },
      ])

      // try connecting socket.io for instant delivery (optional — polling is the reliable fallback)
      try {
        const sock = io('/?XTransformPort=3003', {
          transports: ['websocket', 'polling'],
          reconnection: true,
          timeout: 4000,
        })
        socketRef.current = sock
        sock.on('connect', () => {
          setConnected(true)
          sock.emit('chat:join', { sessionId: data.sessionId, role: 'customer', name: name.trim() })
        })
        sock.on('disconnect', () => setConnected(false))
        sock.on('chat:message', (msg: { id: string; sender: string; content: string; createdAt: string }) => {
          if (msg.sender === 'admin') {
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev
              return [...prev, { id: msg.id, sender: 'admin', content: msg.content, createdAt: msg.createdAt }]
            })
          }
        })
      } catch {}
    } catch {
      toast.error('Холбогдоход алдаа гарлаа')
    } finally {
      setConnecting(false)
    }
  }

  const send = () => {
    if (!input.trim() || !sessionId) return
    const content = input.trim()
    const msgId = 'm_' + Date.now()
    const createdAt = new Date().toISOString()
    setMessages((prev) => [...prev, { id: msgId, sender: 'customer', content, createdAt }])
    // relay via socket if connected (instant), always persist via API
    if (socketRef.current) {
      socketRef.current.emit('chat:message', {
        sessionId,
        sender: 'customer',
        content,
        name,
        phone,
      })
    }
    // persist via API (this triggers the Telegram admin notification)
    fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, sender: 'customer', content }),
    }).catch(() => {})
    setInput('')
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
      socketRef.current?.disconnect()
    }
  }, [])

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div role="region" aria-label="Админтай холбогдох" className="support-panel store-chat overflow-hidden flex flex-col">
          {/* header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="grid size-9 place-items-center rounded-full bg-card/20">
                  <Sparkles className="size-4" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-[#16A34A] border-2 border-white" />
              </div>
              <div>
                <div className="text-sm font-bold leading-tight">SOCIALTOOL.STORE</div>
                <div className="text-[11px] text-white/80">
                  {connected ? 'Онлайн · хариулт тун удахгүй' : 'Холбогдож байна...'}
                </div>
              </div>
            </div>
          </div>

          {!registered ? (
            <div className="flex-1 overflow-y-auto custom-scroll p-5 space-y-4">
              <div className="text-center">
                <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-[#1677FF] to-[#0B4DBA] shadow-premium">
                  <MessageCircle className="size-7 text-white" />
                </div>
                <h3 className="mt-4 text-base font-bold text-foreground">Тавтай морил!</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Тантай холбогдохын тулд нэр, утас оруулна уу. Мессеж илгээхэд админд мэдэгдэнэ.
                </p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <User className="size-3.5" /> Нэр
                  </label>
                  <Input
                    aria-label="Нэр" value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Таны нэр"
                    className="mt-1 border-border"
                    onKeyDown={(e) => e.key === 'Enter' && register()}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Phone className="size-3.5" /> Утас (заавал биш)
                  </label>
                  <Input
                    aria-label="Утас" value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="99112233"
                    className="mt-1 border-border"
                    onKeyDown={(e) => e.key === 'Enter' && register()}
                  />
                </div>
                <Button
                  onClick={register}
                  disabled={connecting}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white gap-2"
                >
                  {connecting ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
                  Чатыг эхлүүлэх
                </Button>
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-primary hover:bg-accent transition-colors"
                >
                  <ExternalLink className="size-4" />
                  Telegram · @{telegramUsername}
                </a>
              </div>
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scroll p-4 space-y-3 bg-muted/40">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                        m.sender === 'customer'
                          ? 'bg-gradient-to-br from-[#1677FF] to-[#0B4DBA] text-white rounded-br-md shadow-premium'
                          : 'bg-card border border-border text-foreground rounded-bl-md shadow-premium'
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                      <p className={`mt-1 text-[10px] ${m.sender === 'customer' ? 'text-white/70' : 'text-muted-foreground'}`}>
                        {new Date(m.createdAt).toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border p-3 bg-card">
                <div className="flex items-end gap-2">
                  <textarea aria-label="Мессеж"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Мессеж бичнэ үү..."
                    rows={1}
                    className="flex-1 resize-none max-h-24 rounded-xl border border-border bg-muted/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-[#1677FF] focus:outline-none focus:ring-2 focus:ring-[#1677FF]/10 custom-scroll"
                  />
                  <Button
                    onClick={send}
                    disabled={!input.trim()}
                    className="h-11 w-11 rounded-xl bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white p-0"
                    aria-label="Илгээх"
                  >
                    <Send className="size-4" />
                  </Button>
                </div>
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-[#1677FF]"
                >
                  <ExternalLink className="size-3" /> Telegram · @{telegramUsername}
                </a>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
