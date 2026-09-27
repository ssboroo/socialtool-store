'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, ChevronRight, Loader2, Send, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatTugrik } from '@/lib/format'
import { useUIStore } from '@/store/cart'
import { trackEvent } from '@/lib/analytics-client'

type Suggestion={id:string;name:string;shortDesc:string;category:string;price:number;oldPrice:number|null;image:string|null;icon:string;duration:string|null}
type Msg={role:'user'|'assistant';text:string;products?:Suggestion[]}

const starters=['AI видео хийхэд юу тохирох вэ?','Facebook-д хэрэгтэй хэрэгсэл','Office лиценз хайж байна','Хэрхэн захиалах вэ?']

export function ShoppingAssistant(){
  const [open,setOpen]=useState(false)
  const [input,setInput]=useState('')
  const [busy,setBusy]=useState(false)
  const [messages,setMessages]=useState<Msg[]>([{role:'assistant',text:'Сайн байна уу. Хэрэгцээгээ бичээрэй — би Socialtool.store-ийн каталогоос тохирох бүтээгдэхүүн хайж өгнө.'}])
  const end=useRef<HTMLDivElement>(null)
  const setProduct=useUIStore(s=>s.setSelectedProduct)
  useEffect(()=>{end.current?.scrollIntoView({behavior:'smooth'})},[messages,busy,open])
  const ask=async(value?:string)=>{
    const text=(value??input).trim();if(!text||busy)return
    setInput('');setMessages(m=>[...m,{role:'user',text}]);setBusy(true);trackEvent('assistant_query',{query:text})
    try{
      const res=await fetch('/api/assistant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text})})
      const data=await res.json()
      if(!res.ok)throw new Error(data.error||'Алдаа')
      const products=Array.isArray(data.products)?data.products:[]
      setMessages(m=>[...m,{role:'assistant',text:data.answer||'Санал олдсонгүй.',products}])
      if(products.length)trackEvent('assistant_recommendation',{query:text,value:products.length})
    }catch(e){setMessages(m=>[...m,{role:'assistant',text:e instanceof Error?e.message:'Зөвлөх түр ажиллахгүй байна.'}])}
    finally{setBusy(false)}
  }
  return <>
    {!open&&<button type="button" onClick={()=>setOpen(true)} className="fixed bottom-[5.25rem] right-4 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#1677FF] px-4 py-3 text-sm font-bold text-white shadow-premium-lg hover:scale-[1.02] transition-transform" aria-label="AI худалдааны зөвлөх"><Sparkles className="size-4"/>AI зөвлөх</button>}
    {open&&<section className="fixed bottom-4 right-4 z-[70] flex h-[min(620px,82vh)] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[26px] border border-[#D6E4FF] bg-white shadow-2xl" aria-label="AI худалдааны зөвлөх">
      <header className="flex items-center justify-between bg-gradient-to-r from-[#7C3AED] to-[#1677FF] px-4 py-3 text-white"><div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-xl bg-white/15"><Bot className="size-5"/></span><div><strong className="block text-sm">AI худалдааны зөвлөх</strong><span className="text-[11px] text-white/75">Каталог дээр тулгуурласан санал</span></div></div><button onClick={()=>setOpen(false)} className="grid size-9 place-items-center rounded-full hover:bg-white/15" aria-label="Хаах"><X className="size-5"/></button></header>
      <div className="flex-1 overflow-y-auto bg-[#F8FAFF] p-3 space-y-3">
        {messages.map((m,i)=><div key={i} className={m.role==='user'?'ml-10':'mr-4'}><div className={m.role==='user'?'rounded-2xl rounded-br-md bg-[#1677FF] px-3.5 py-2.5 text-sm text-white':'rounded-2xl rounded-bl-md border border-[#D6E4FF] bg-white px-3.5 py-2.5 text-sm text-[#102A43]'}>{m.text}</div>{m.products?.length?<div className="mt-2 space-y-2">{m.products.map(p=><button key={p.id} type="button" onClick={()=>{setOpen(false);setProduct(p.id)}} className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#D6E4FF] bg-white p-3 text-left hover:border-[#1677FF]"><div className="min-w-0"><strong className="line-clamp-1 text-xs text-[#102A43]">{p.name}</strong><span className="mt-0.5 block text-[11px] text-[#5B7290]">{p.category}</span></div><div className="flex shrink-0 items-center gap-1 text-xs font-bold text-[#0B4DBA]">{formatTugrik(p.price)}<ChevronRight className="size-3.5"/></div></button>)}</div>:null}</div>)}
        {busy&&<div className="mr-16 flex items-center gap-2 rounded-2xl border bg-white px-3.5 py-3 text-xs text-[#5B7290]"><Loader2 className="size-4 animate-spin"/>Каталогоос хайж байна…</div>}
        {messages.length===1&&!busy?<div className="flex flex-wrap gap-1.5">{starters.map(s=><button key={s} onClick={()=>void ask(s)} className="rounded-full border border-[#D6E4FF] bg-white px-2.5 py-1.5 text-[11px] text-[#0B4DBA] hover:bg-[#E8F1FF]">{s}</button>)}</div>:null}
        <div ref={end}/>
      </div>
      <form onSubmit={e=>{e.preventDefault();void ask()}} className="flex gap-2 border-t border-[#EEF4FF] bg-white p-3"><Input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ж: Canva Pro хэрэгтэй..." maxLength={500} className="rounded-full"/><Button type="submit" size="icon" disabled={busy||!input.trim()} className="shrink-0 rounded-full"><Send className="size-4"/></Button></form>
    </section>}
  </>
}
