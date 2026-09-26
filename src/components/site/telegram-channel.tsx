'use client'
import { useEffect } from 'react'
import { Send } from 'lucide-react'
import { useUIStore } from '@/store/cart'
import { validChannelUrl } from '@/lib/telegram-channel'
export function TelegramChannel({url}:{url?:string}){
 const select=useUIStore(s=>s.setSelectedProduct)
 useEffect(()=>{const id=new URLSearchParams(window.location.search).get('product');if(id&&/^[a-zA-Z0-9_-]{1,120}$/.test(id))select(id)},[select])
 if(!url||!validChannelUrl(url))return null
 return <aside className="mx-auto my-8 w-full max-w-7xl px-4"><div className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-blue-200 bg-blue-50 p-6 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"><div><h2 className="text-xl font-bold">Шинэ бүтээгдэхүүнээ Telegram-аас хараарай</h2><p className="mt-2">Шинэ бараа, эрх болон үнийн мэдээллийг манай сувгаас аваарай.</p></div><a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-center font-semibold text-white"><Send size={20}/>Telegram сувагт нэгдэх</a></div></aside>
}
