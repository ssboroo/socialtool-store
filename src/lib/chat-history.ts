// Each tab restores chats only for its current authenticated identity.
// Old, unscoped browser history is deliberately discarded once.
export function syncChatIdentity(customerId: string | null) {
  if (typeof window === 'undefined') return
  const owner = customerId ? 'customer:' + customerId : 'guest'
  try {
    if (sessionStorage.getItem('st-chat-owner-v2') !== owner) {
      sessionStorage.removeItem('st-order-chat')
      sessionStorage.removeItem('st-chat-history-v2')
      sessionStorage.setItem('st-chat-owner-v2', owner)
    }
    localStorage.removeItem('st-chat-history')
    localStorage.removeItem('st-notification-read')
  } catch {}
}
export function rememberChat(id: string) {
  if (!/^[a-zA-Z0-9_-]{10,100}$/.test(id)) return
  try {
    const old = JSON.parse(sessionStorage.getItem('st-chat-history-v2') || '[]')
    const ids = Array.isArray(old) ? old.filter(v => typeof v === 'string') : []
    sessionStorage.setItem('st-chat-history-v2', JSON.stringify([id, ...ids.filter(v => v !== id)].slice(0, 30)))
    sessionStorage.setItem('st-order-chat', id)
  } catch {}
}
export function savedChats(): string[] {
  try { const ids = JSON.parse(sessionStorage.getItem('st-chat-history-v2') || '[]'); return Array.isArray(ids) ? ids.filter(v => typeof v === 'string' && /^[a-zA-Z0-9_-]{10,100}$/.test(v)).slice(0,30) : [] } catch { return [] }
}
