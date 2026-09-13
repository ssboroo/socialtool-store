export function rememberChat(id: string) {
  if (!/^[a-zA-Z0-9_-]{10,100}$/.test(id)) return
  try {
    const old = JSON.parse(localStorage.getItem('st-chat-history') || '[]')
    const ids = Array.isArray(old) ? old.filter(v => typeof v === 'string') : []
    localStorage.setItem('st-chat-history', JSON.stringify([id, ...ids.filter(v => v !== id)].slice(0, 30)))
    sessionStorage.setItem('st-order-chat', id)
  } catch {}
}
export function savedChats(): string[] {
  try { const ids = JSON.parse(localStorage.getItem('st-chat-history') || '[]'); return Array.isArray(ids) ? ids.filter(v => typeof v === 'string' && /^[a-zA-Z0-9_-]{10,100}$/.test(v)).slice(0,30) : [] } catch { return [] }
}
