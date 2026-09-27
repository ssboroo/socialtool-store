type TrackingEvent = 'product_view' | 'cart_add' | 'checkout_start' | 'search'
let sessionId: string | null = null

function visitorSession() {
  if (typeof window === 'undefined') return null
  if (navigator.doNotTrack === '1' || localStorage.getItem('st-analytics-optout') === '1') return null
  if (sessionId) return sessionId
  try {
    const saved = sessionStorage.getItem('st-analytics-session')
    sessionId = saved && /^[a-f0-9]{8}-[a-f0-9-]{27,40}$/i.test(saved) ? saved : crypto.randomUUID()
    sessionStorage.setItem('st-analytics-session', sessionId)
    return sessionId
  } catch { return null }
}

/** Anonymous, best-effort usage metrics. Never block checkout on analytics. */
export function trackStoreEvent(type: TrackingEvent, fields: { productId?: string; query?: string } = {}) {
  try {
    const sid = visitorSession()
    if (!sid) return
    void fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      keepalive: true,
      body: JSON.stringify({ type, sessionId: sid, ...fields }),
    }).catch(() => {})
  } catch { /* analytics is always optional */ }
}
