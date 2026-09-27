'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, CircleAlert, Info, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Issue={productId:string;productName:string;severity:'critical'|'warning'|'info';code:string;message:string}
type Data={summary:{products:number;healthy:number;critical:number;warning:number;info:number};issues:Issue[]}
export function AdminProductHealth({token}:{token:string}){
  const [data,setData]=useState<Data|null>(null);const [loading,setLoading]=useState(true);const [filter,setFilter]=useState<'all'|'critical'|'warning'|'info'>('all');const [reload,setReload]=useState(0)
  useEffect(()=>{const c=new AbortController();queueMicrotask(()=>{if(!c.signal.aborted)setLoading(true)});fetch('/api/admin/product-health',{headers:{authorization:'Bearer '+token},signal:c.signal,cache:'no-store'}).then(r=>r.json()).then(d=>{if(!c.signal.aborted)setData(d)}).finally(()=>{if(!c.signal.aborted)setLoading(false)});return()=>c.abort()},[token,reload])
  const issues=useMemo(()=>data?.issues.filter(i=>filter==='all'||i.severity===filter)||[],[data,filter])
  if(!data&&loading)return <div className="py-24 text-center text-[#5B7290]">Бүтээгдэхүүн шалгаж байна…</div>
  if(!data)return <div className="py-24 text-center text-[#5B7290]">Шалгалтын мэдээлэл олдсонгүй</div>
  const icon=(s:Issue['severity'])=>s==='critical'?<CircleAlert className="size-4 text-red-500"/>:s==='warning'?<AlertTriangle className="size-4 text-amber-500"/>:<Info className="size-4 text-blue-500"/>
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-extrabold text-[#102A43]">Product Health</h2><p className="text-sm text-[#5B7290]">Үнэ, зураг, тайлбар, холбоос, тохиргооны алдааг автоматаар шалгана.</p></div><Button variant="outline" onClick={()=>setReload(v=>v+1)} disabled={loading}><RefreshCw className={'mr-2 size-4 '+(loading?'animate-spin':'')}/>Дахин шалгах</Button></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {[['Нийт',data.summary.products],['Эрүүл',data.summary.healthy],['Critical',data.summary.critical],['Warning',data.summary.warning],['Info',data.summary.info]].map(([label,value])=><div key={String(label)} className="rounded-2xl border border-[#D6E4FF] bg-white p-4 shadow-sm"><p className="text-xs text-[#5B7290]">{label}</p><strong className="mt-1 block text-2xl text-[#102A43]">{value}</strong></div>)}
    </div>
    <div className="flex flex-wrap gap-2">{(['all','critical','warning','info'] as const).map(v=><Button key={v} size="sm" variant={filter===v?'default':'outline'} onClick={()=>setFilter(v)}>{v==='all'?'Бүгд':v}</Button>)}</div>
    <div className="overflow-hidden rounded-2xl border border-[#D6E4FF] bg-white shadow-sm">{issues.length?issues.map((i,index)=><div key={i.productId+i.code+index} className="flex gap-3 border-b border-[#EEF4FF] p-4 last:border-b-0">{icon(i.severity)}<div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-[#102A43]">{i.productName}</strong><span className="rounded-full bg-[#F5F9FF] px-2 py-0.5 text-[10px] uppercase text-[#5B7290]">{i.code}</span></div><p className="mt-1 text-sm text-[#5B7290]">{i.message}</p></div></div>):<div className="py-16 text-center"><CheckCircle2 className="mx-auto size-10 text-green-500"/><h3 className="mt-3 font-bold text-[#102A43]">Энэ ангилалд асуудал алга</h3></div>}</div>
  </div>
}
