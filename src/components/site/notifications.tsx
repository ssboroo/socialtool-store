'use client'
import { useEffect, useState } from 'react'
import { Bell, ArrowUpRight } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useCustomer } from '@/hooks/use-customer'
import { rememberChat, savedChats } from '@/lib/chat-history'
type Notice = { id: string; sessionId: string; content: string; createdAt: string; readAt?: string | null; orderNumber?: string }
export function Notifications() {
  const { customer, loading } = useCustomer()
  if (loading) return null
  return <NotificationList key={customer?.id || 'guest'} authenticated={!!customer} />
}
function NotificationList({ authenticated }: { authenticated: boolean }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notice[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let stopped = false
    const poll = async () => {
      try {
        let notifications: Notice[] = []
        if (authenticated) {
          const res = await fetch('/api/customer/notifications', { cache: 'no-store' })
          if (!res.ok) throw new Error('Мэдэгдэл ачаалсангүй. Дахин оролдоно уу.')
          notifications = (await res.json()).notifications
        } else {
          const legacy = sessionStorage.getItem('st-order-chat'); if (legacy) rememberChat(legacy)
          const read = JSON.parse(localStorage.getItem('st-notification-read') || '[]') as string[]
          const lists = await Promise.all(savedChats().map(async sessionId => {
            const res = await fetch(`/api/chat/sessions/${sessionId}`, { cache: 'no-store' })
            if (res.status === 404) return []
            if (!res.ok) throw new Error('Мэдэгдэл ачаалсангүй')
            const data = await res.json()
            return data.messages.filter((m: {sender: string}) => ['system','admin'].includes(m.sender)).map((m: Notice) => ({...m, sessionId, readAt: read.includes(m.id) ? 'read' : null}))
          }))
          notifications = lists.flat().sort((a,b) => Date.parse(b.createdAt)-Date.parse(a.createdAt)).slice(0,100)
        }
        if (!stopped) { setItems(notifications); setError('') }
      } catch (e) { if (!stopped) setError(e instanceof Error ? e.message : 'Мэдэгдэл ачаалсангүй') }
      finally { if (!stopped) setLoading(false) }
    }
    void poll()
    const timer = setInterval(poll, 5000)
    const refresh = () => { void poll() }
    window.addEventListener('st-chat-session', refresh)
    window.addEventListener('focus', refresh)
    return () => { stopped = true; clearInterval(timer); window.removeEventListener('st-chat-session', refresh); window.removeEventListener('focus', refresh) }
  }, [authenticated])
  const markRead = async (ids: string[]) => {
    try {
      if (authenticated) {
        const res = await fetch('/api/customer/notifications', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ids }) })
        if (!res.ok) throw new Error('Уншсан төлөв хадгалагдсангүй')
      } else {
        const old = JSON.parse(localStorage.getItem('st-notification-read') || '[]')
        localStorage.setItem('st-notification-read', JSON.stringify([...new Set([...old, ...ids])].slice(-300)))
      }
      setItems(v => v.map(n => ids.includes(n.id) ? {...n, readAt:'read'} : n))
    } catch { setError('Уншсан төлөв хадгалагдсангүй. Дахин оролдоорой.') }
  }
  const unread = items.filter(n => !n.readAt).length
  return <>
    <button type="button" onClick={() => setOpen(true)} aria-label={`Мэдэгдэл${unread ? `, ${unread} уншаагүй` : ''}`} className="relative grid size-10 shrink-0 place-items-center rounded-full text-slate-700 hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-500"><Bell className="size-5" />{unread > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-blue-600 px-1 text-center text-[10px] leading-5 text-white">{unread > 99 ? '99+' : unread}</span>}</button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[85dvh] max-w-lg overflow-y-auto rounded-2xl"><DialogTitle>Мэдэгдэл</DialogTitle><p className="text-sm text-slate-500">Төлбөрийн баталгаажуулалт болон захиалгын чатны хариу энд хадгалагдана.</p>{!authenticated && <p className="text-xs text-slate-500">Зочны мэдэгдэл энэ хөтөч дээр хадгалагдана. Бүртгэлээр хийсэн захиалгын мэдэгдлээ бусад төхөөрөмжөөс нэвтэрч харна.</p>}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {unread > 0 && <button type="button" className="text-left text-sm font-semibold text-blue-600" onClick={() => void markRead(items.filter(n=>!n.readAt).map(n=>n.id))}>Бүгдийг уншсан болгох</button>}
      {loading ? <p role="status">Ачаалж байна…</p> : !items.length && !error ? <p className="py-8 text-center text-slate-500">Одоогоор мэдэгдэл алга.</p> : null}
      <div className="space-y-3">{items.map(n => <button key={n.id} type="button" onClick={() => { void markRead([n.id]); rememberChat(n.sessionId); window.dispatchEvent(new CustomEvent('st-chat-session', { detail:n.sessionId })); setOpen(false); window.dispatchEvent(new Event('st-open-chat')) }} className={`w-full rounded-xl border p-4 text-left ${n.readAt ? 'border-slate-200 bg-white' : 'border-blue-200 bg-blue-50'}`}><span className="flex items-center justify-between gap-2 text-sm font-bold text-slate-900">{n.orderNumber ? `Захиалга #${n.orderNumber}` : 'Захиалгын чат'}{!n.readAt && <span className="size-2 rounded-full bg-blue-600" />}</span><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{n.content}</p><span className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500"><time dateTime={n.createdAt}>{new Date(n.createdAt).toLocaleString('mn-MN',{timeZone:'Asia/Ulaanbaatar'})}</time><span className="inline-flex items-center gap-1 text-blue-600">Чат нээх<ArrowUpRight className="size-3" /></span></span></button>)}</div>
    </DialogContent></Dialog>
  </>
}
