'use client'

import { useEffect, useState } from 'react'
import { BarChart3, Eye, Heart, Search, ShoppingCart, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatTugrik } from '@/lib/format'

type Row={productId:string;name:string;count:number}
type Data={
  days:number;revenue:number;paidOrders:number;units:number;sessions:number;wishlistCount:number;conversionRate:number;
  events:Record<string,number>;topViewed:Row[];topCart:Row[];topWishlisted:Row[];topPurchased:Row[];
  topSearches:{query:string;count:number}[]
}

function Ranking({title,rows}:{title:string;rows:Row[]}){
  return <div className="rounded-2xl border border-[#D6E4FF] bg-white shadow-sm overflow-hidden"><div className="border-b border-[#EEF4FF] px-4 py-3 text-sm font-bold text-[#102A43]">{title}</div><div className="divide-y divide-[#EEF4FF]">{rows.length?rows.map((r,i)=><div key={r.productId} className="flex items-center gap-3 px-4 py-2.5 text-sm"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#E8F1FF] text-xs font-bold text-[#0B4DBA]">{i+1}</span><span className="min-w-0 flex-1 truncate text-[#102A43]">{r.name}</span><strong>{r.count}</strong></div>):<p className="px-4 py-8 text-center text-sm text-[#5B7290]">Мэдээлэл хараахан алга</p>}</div></div>
}
export function AdminAnalytics({token}:{token:string}){
  const [days,setDays]=useState(30);const [data,setData]=useState<Data|null>(null);const [loading,setLoading]=useState(true)
  useEffect(()=>{const c=new AbortController();queueMicrotask(()=>{if(!c.signal.aborted)setLoading(true)});fetch('/api/admin/analytics?days='+days,{signal:c.signal,headers:{authorization:'Bearer '+token},cache:'no-store'}).then(r=>r.json()).then(d=>{if(!c.signal.aborted)setData(d)}).finally(()=>{if(!c.signal.aborted)setLoading(false)});return()=>c.abort()},[days,token])
  if(loading&&!data)return <div className="py-24 text-center text-[#5B7290]">Аналитик ачаалж байна…</div>
  if(!data)return <div className="py-24 text-center text-[#5B7290]">Аналитик ачаалж чадсангүй</div>
  const cards=[
    ['Орлого',formatTugrik(data.revenue),TrendingUp],
    ['Төлөгдсөн захиалга',String(data.paidOrders),ShoppingCart],
    ['Conversion',data.conversionRate+'%',BarChart3],
    ['Wishlist',String(data.wishlistCount),Heart],
    ['Бүтээгдэхүүн үзэлт',String(data.events.product_view||0),Eye],
    ['Хайлт',String(data.events.search||0),Search],
  ] as const
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-extrabold text-[#102A43]">Борлуулалтын аналитик</h2><p className="text-sm text-[#5B7290]">Хайлт → бүтээгдэхүүн → сагс → төлбөрийн funnel</p></div><div className="flex gap-2">{[7,30,90].map(n=><Button key={n} size="sm" variant={days===n?'default':'outline'} onClick={()=>setDays(n)}>{n} хоног</Button>)}</div></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">{cards.map(([label,value,Icon])=><div key={label} className="rounded-2xl border border-[#D6E4FF] bg-white p-4 shadow-sm"><Icon className="size-5 text-[#1677FF]"/><p className="mt-3 text-xs text-[#5B7290]">{label}</p><strong className="mt-1 block text-xl text-[#102A43]">{value}</strong></div>)}</div>
    <div className="grid gap-4 lg:grid-cols-2"><Ranking title="Хамгийн их үзсэн" rows={data.topViewed}/><Ranking title="Хамгийн их сагсалсан" rows={data.topCart}/><Ranking title="Wishlist ихтэй" rows={data.topWishlisted}/><Ranking title="Хамгийн их зарагдсан" rows={data.topPurchased}/></div>
    <div className="rounded-2xl border border-[#D6E4FF] bg-white shadow-sm overflow-hidden"><div className="border-b border-[#EEF4FF] px-4 py-3 text-sm font-bold text-[#102A43]">Хамгийн их хайсан үгс</div><div className="flex flex-wrap gap-2 p-4">{data.topSearches.length?data.topSearches.map(r=><span key={r.query} className="rounded-full border border-[#D6E4FF] bg-[#F5F9FF] px-3 py-1.5 text-xs text-[#102A43]">{r.query} <strong className="ml-1 text-[#1677FF]">{r.count}</strong></span>):<p className="text-sm text-[#5B7290]">Хайлт хараахан бүртгэгдээгүй.</p>}</div></div>
  </div>
}
