'use client'

import type { AnalyticsType } from '@/lib/analytics'

function sessionId() {
  if (typeof window === 'undefined') return ''
  const key='socialtool-analytics-session'
  try {
    let value=localStorage.getItem(key)
    if (!value) {
      value=(globalThis.crypto?.randomUUID?.() || (Date.now() + '-' + Math.random().toString(36).slice(2))).slice(0,120)
      localStorage.setItem(key,value)
    }
    return value
  } catch {
    return 'session-' + Date.now()
  }
}

export function trackEvent(type:AnalyticsType, data:{productId?:string;query?:string;value?:number;meta?:Record<string,unknown>}={}) {
  if (typeof window === 'undefined') return
  const body=JSON.stringify({type,sessionId:sessionId(),...data})
  try {
    if (navigator.sendBeacon) {
      const ok=navigator.sendBeacon('/api/analytics',new Blob([body],{type:'application/json'}))
      if (ok) return
    }
  } catch {}
  void fetch('/api/analytics',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{})
}
