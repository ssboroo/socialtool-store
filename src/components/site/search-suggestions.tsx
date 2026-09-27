'use client'
import { useEffect,useState } from 'react'
import { Search, ArrowUpRight } from 'lucide-react'
import { formatTugrik } from '@/lib/format'
type Hit={id:string;name:string;shortDesc:string;price:number;category:string;icon:string;image:string|null}
export function SearchSuggestions({query,onChoose}:{query:string;onChoose:(id:string)=>void}){
 const [hits,setHits]=useState<Hit[]>([]),[pending,setPending]=useState(false)
 useEffect(()=>{
  if(query.trim().length<2)return
  const ctl=new AbortController()
  const timer=setTimeout(()=>{
   void fetch('/api/search?q='+encodeURIComponent(query.trim()),{signal:ctl.signal})
    .then(r=>r.json()).then(d=>{if(!ctl.signal.aborted)setHits(Array.isArray(d.products)?d.products.slice(0,5):[])})
    .catch(()=>{}).finally(()=>{if(!ctl.signal.aborted)setPending(false)})
  },200)
  return()=>{clearTimeout(timer);ctl.abort()}
 },[query])
 if(query.trim().length<2)return null
 return <div className="absolute left-0 right-0 top-full z-[80] mt-2 min-w-[270px] overflow-hidden rounded-2xl border border-[#D6E4FF] bg-white p-2 shadow-xl" role="listbox" aria-label="Хайлтын санал">
  <div className="px-2 py-1 text-xs text-slate-500">{pending?'Хайж байна…':'Тохирох бүтээгдэхүүнүүд'}</div>
  {hits.length===0?<p className="px-3 py-4 text-xs text-slate-500">Үр дүн олдсонгүй</p>:hits.map(hit=><button type="button" key={hit.id} onClick={()=>onChoose(hit.id)} role="option" aria-selected="false" className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-blue-50">
   {hit.image?<img src={hit.image} alt="" className="size-10 rounded-lg object-contain"/>:<Search className="size-5 text-blue-500"/>}
   <span className="min-w-0 flex-1"><strong className="block truncate text-sm text-[#102A43]">{hit.name}</strong><small className="text-[#5B7290]">{formatTugrik(hit.price)}</small></span><ArrowUpRight className="size-4 text-slate-400"/>
  </button>)}
 </div>
}
