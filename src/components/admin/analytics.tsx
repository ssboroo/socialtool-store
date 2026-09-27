'use client'
import { useEffect,useState } from 'react'
import { Activity, ShoppingCart, Eye, Banknote, Search, Heart } from 'lucide-react'
import { formatTugrik } from '@/lib/format'
type Metrics={days:number;counts:Record<string,number>;paidOrders:number;revenue:number;averageOrderValue:number;searchTop:{query:string;count:number}[];topProducts:{id:string;name:string;views:number;cart:number;wishlistCurrent:number;orders:number;revenue:number}[];byDay:{day:string;views:number;cart:number;paid:number}[]}
export function AdminAnalytics({token}:{token:string}){
 const [days,setDays]=useState(30),[data,setData]=useState<Metrics|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true)
 useEffect(()=>{const ctl=new AbortController()
  void fetch('/api/admin/analytics?days='+days,{headers:{authorization:'Bearer '+token},signal:ctl.signal})
  .then(async r=>{if(!r.ok)throw Error('Тайлан ачаалж чадсангүй');return r.json() as Promise<Metrics>})
  .then(v=>{if(!ctl.signal.aborted){setData(v);setError('')}})
  .catch(e=>{if(!ctl.signal.aborted)setError(e.message)}).finally(()=>{if(!ctl.signal.aborted)setLoading(false)})
  return()=>ctl.abort()
 },[days,token])
 const cards=[{label:'Үзэлт',value:data?.counts.product_view||0,Icon:Eye},{label:'Сагсанд нэмсэн',value:data?.counts.add_to_cart||0,Icon:ShoppingCart},{label:'Төлөгдсөн захиалга',value:data?.paidOrders||0,Icon:Activity},{label:'Орлого',value:formatTugrik(data?.revenue||0),Icon:Banknote},{label:'Хадгалсан',value:data?.counts.wishlist_add||0,Icon:Heart}]
 const maxViews=Math.max(1,...(data?.byDay||[]).map(d=>d.views))
 return <div className="space-y-5 text-[#102A43]">
  <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-2xl font-bold">Борлуулалтын аналитик</h2><p className="text-xs text-[#5B7290]">Үзэлт болон хайлт нь хувийн мэдээлэлгүй event; орлого нь төлөгдсөн захиалга.</p></div><select aria-label="Хугацаа" value={days} onChange={e=>{setLoading(true);setDays(Number(e.target.value))}} className="rounded-xl border border-[#D6E4FF] bg-white p-3">{[7,30,90].map(n=><option key={n} value={n}>Сүүлийн {n} хоног</option>)}</select></div>
  {loading&&<p role="status">Ачаалж байна…</p>}{error&&<p role="alert" className="text-rose-600">{error}</p>}
  {data&&<><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{cards.map(({label,value,Icon})=><div key={label} className="rounded-2xl border border-[#D6E4FF] bg-white p-5 shadow-sm"><Icon className="mb-3 size-5 text-blue-600"/><p className="text-xs text-[#5B7290]">{label}</p><strong className="text-xl">{value}</strong></div>)}</div>
   <div className="grid gap-4 lg:grid-cols-2"><section className="rounded-2xl border bg-white p-5"><h3 className="mb-4 font-bold">Өдөр тутмын хандалт</h3><div className="flex h-40 items-end gap-1 overflow-hidden" role="img" aria-label="Өдөр тус бүрийн бүтээгдэхүүний үзэлт">{data.byDay.map(row=><div key={row.day} title={row.day+': '+row.views+' үзэлт'} className="min-w-1 flex-1 rounded-t bg-gradient-to-t from-[#1677FF] to-[#9E8CFF]" style={{height:Math.max(4,row.views/maxViews*100)+'%'}}/>)}</div><p className="mt-3 text-xs text-slate-500">Захиалгын дундаж: {formatTugrik(data.averageOrderValue)}</p></section>
   <section className="rounded-2xl border bg-white p-5"><h3 className="mb-4 flex items-center gap-2 font-bold"><Search className="size-4"/>Их хайсан үгс</h3>{data.searchTop.length?data.searchTop.map(row=><div key={row.query} className="flex justify-between border-b py-2 text-sm"><span>{row.query}</span><b>{row.count}</b></div>):<p className="text-sm text-slate-500">Одоогоор хайлтын өгөгдөл байхгүй</p>}</section></div>
   <section className="overflow-x-auto rounded-2xl border bg-white p-5"><h3 className="mb-4 font-bold">Бүтээгдэхүүний үзүүлэлт</h3><table className="w-full min-w-[650px] text-left text-sm"><thead className="border-b text-slate-500"><tr>{['Бүтээгдэхүүн','Үзэлт','Сагс','Захиалсан','Хадгалсан','Орлого'].map(x=><th key={x} className="p-2">{x}</th>)}</tr></thead><tbody>{data.topProducts.map(p=><tr key={p.id} className="border-b"><td className="p-2 font-semibold">{p.name}</td><td className="p-2">{p.views}</td><td className="p-2">{p.cart}</td><td className="p-2">{p.orders}</td><td className="p-2">{p.wishlistCurrent}</td><td className="p-2">{formatTugrik(p.revenue)}</td></tr>)}</tbody></table></section>
   <p className="text-xs text-slate-500">Зочны давхардсан session ялгахгүй тул баталгаагүй хөрвүүлэлтийн хувь харуулахгүй.</p></>}
 </div>
}
