'use client'
import { useState, useEffect, useRef } from 'react'
import { Sparkles, X, Send, Headphones, ShoppingBag, Loader2 } from 'lucide-react'
import { useUIStore } from '@/store/cart'
import { formatTugrik } from '@/lib/format'
type Hit = { id:string;name:string;price:number;shortDesc:string }
type Msg = {sender:'customer'|'advisor';text:string;products?:Hit[];mode?:string}
export function ShoppingAdvisor(){
 const [open,setOpen]=useState(false),[input,setInput]=useState(''),[sending,setSending]=useState(false)
 const [messages,setMessages]=useState<Msg[]>([{sender:'advisor',text:'Сайн байна уу! Ямар хэрэгсэл хайж байна вэ? Платформ эсвэл зориулалтаа бичээрэй. Би байгаа бүтээгдэхүүнээс санал болгоно.'}])
 const detail=useUIStore(s=>s.setSelectedProduct),scrollRef=useRef<HTMLDivElement>(null)
 useEffect(()=>{if(open)scrollRef.current?.scrollTo({top:scrollRef.current.scrollHeight,behavior:'smooth'})},[messages,open])
 const send=async(text=input)=>{
  const message=text.trim();if(sending||message.length<2)return
  setMessages(old=>[...old,{sender:'customer',text:message}]);setInput('');setSending(true)
  try{
   const res=await fetch('/api/assistant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message})})
   const data=await res.json();if(!res.ok)throw Error(data.error||'Хариулт авах боломжгүй')
   setMessages(old=>[...old,{sender:'advisor',text:data.answer,products:data.products,mode:data.mode}])
  }catch(e){setMessages(old=>[...old,{sender:'advisor',text:e instanceof Error?e.message:'Түр боломжгүй байна. Админтай холбогдоно уу.'}])}finally{setSending(false)}
 }
 return <>
  <button type="button" onClick={()=>setOpen(v=>!v)} aria-label="Худалдааны зөвлөх" aria-expanded={open} className="fixed bottom-5 left-5 z-[70] flex items-center gap-2 rounded-full bg-gradient-to-r from-[#6C3CFF] to-[#1677FF] px-4 py-3 text-sm font-semibold text-white shadow-xl transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"><Sparkles className="size-5"/><span className="hidden sm:inline">AI зөвлөх</span></button>
  {open&&<div role="dialog" aria-label="Худалдааны AI зөвлөх" className="fixed bottom-20 left-3 z-[80] flex h-[min(72vh,560px)] w-[calc(100vw-1.5rem)] max-w-[390px] flex-col overflow-hidden rounded-3xl border border-[#D6E4FF] bg-white shadow-2xl sm:left-5">
   <header className="flex items-center justify-between bg-gradient-to-r from-[#6C3CFF] to-[#1677FF] p-4 text-white"><div><h3 className="flex items-center gap-2 font-bold"><Sparkles className="size-5"/>Худалдааны зөвлөх</h3><p className="mt-1 text-xs text-white/80">Бодит каталогоос санал болгоно</p></div><button onClick={()=>setOpen(false)} aria-label="Хаах" className="rounded-full p-2 hover:bg-white/20"><X className="size-5"/></button></header>
   <div className="flex-1 space-y-3 overflow-y-auto p-4" ref={scrollRef} aria-live="polite">
    {messages.map((msg,i)=><div key={i} className={'max-w-[95%] rounded-2xl p-3 text-sm leading-relaxed '+(msg.sender==='customer'?'ml-auto bg-[#1677FF] text-white':'border border-[#E1EAFE] bg-[#F5F9FF] text-[#102A43]')}>
      <p className="whitespace-pre-wrap">{msg.text}</p>
      {msg.mode==='guided'&&<p className="mt-2 text-[11px] text-slate-500">Каталогт суурилсан автомат санал</p>}
      {msg.products?.map(p=><button key={p.id} type="button" onClick={()=>{detail(p.id);setOpen(false)}} className="mt-2 flex w-full items-center justify-between gap-2 rounded-xl border border-[#D6E4FF] bg-white p-2 text-left text-[#102A43] hover:border-blue-500"><span className="min-w-0"><strong className="block truncate">{p.name}</strong><small className="text-blue-600">{formatTugrik(p.price)}</small></span><ShoppingBag className="size-4 shrink-0"/></button>)}
    </div>)}
    {sending&&<p className="flex items-center gap-2 text-xs text-slate-500"><Loader2 className="size-4 animate-spin"/>Хариулт бэлтгэж байна…</p>}
   </div>
   {messages.length===1&&<div className="flex flex-wrap gap-2 px-4 pb-2">{['AI видео бүтээх','Canva Pro','Facebook хэрэгсэл'].map(q=><button key={q} onClick={()=>void send(q)} className="rounded-full border border-blue-200 px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-50">{q}</button>)}</div>}
   <div className="border-t border-[#D6E4FF] p-3"><form onSubmit={e=>{e.preventDefault();void send()}} className="flex gap-2"><input required minLength={2} maxLength={450} value={input} onChange={e=>setInput(e.target.value)} placeholder="Танд ямар хэрэгсэл хэрэгтэй вэ?" aria-label="Зөвлөхөөс асуух" className="min-w-0 flex-1 rounded-xl border border-[#D6E4FF] px-3 text-sm text-[#102A43] focus:outline-blue-500"/><button disabled={sending||input.trim().length<2} type="submit" className="grid size-10 place-items-center rounded-xl bg-blue-600 text-white disabled:opacity-40"><Send className="size-4"/></button></form><button onClick={()=>{setOpen(false);window.dispatchEvent(new Event('st-open-chat'))}} className="mt-2 flex items-center gap-2 text-xs text-[#1677FF] underline"><Headphones className="size-4"/>Админтай холбогдох</button></div>
  </div>}
 </>
}
