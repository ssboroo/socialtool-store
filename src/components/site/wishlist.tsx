'use client'
import { useEffect } from 'react'
import { Heart, X, ShoppingBag, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useCustomer } from '@/hooks/use-customer'
import { useUIStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlist'
import { trackStoreEvent } from '@/lib/analytics-client'
import { formatTugrik } from '@/lib/format'

export function WishlistBootstrap(){
 const {customer,loading}=useCustomer()
 const refresh=useWishlistStore(s=>s.refresh)
 useEffect(()=>{if(!loading)void refresh(customer?.id||null)},[customer?.id,loading,refresh])
 return <WishlistPanel/>
}
export function WishlistButton({productId}:{productId:string}){
 const {customer}=useCustomer()
 const saved=useWishlistStore(s=>s.ids.includes(productId))
 const toggle=useWishlistStore(s=>s.toggle)
 const busy=useWishlistStore(s=>s.busy)
 const auth=useUIStore(s=>s.openAuth)
 const handle=async(e:React.MouseEvent)=>{
  e.stopPropagation()
  if(!customer){toast('Хүслийн жагсаалтад хадгалахын тулд нэвтэрнэ үү');auth('login');return}
  try{const nowSaved=await toggle(productId);trackStoreEvent(nowSaved?'wishlist_add':'wishlist_remove',productId);toast.success(nowSaved?'Хүслийн жагсаалтад хадгаллаа':'Жагсаалтаас хаслаа')}
  catch(e){toast.error(e instanceof Error?e.message:'Хадгалж чадсангүй')}
 }
 return <button type="button" onClick={handle} disabled={busy} aria-pressed={saved} aria-label={saved?'Хүслийн жагсаалтаас хасах':'Хүслийн жагсаалтад хадгалах'} title={saved?'Хадгалсан':'Хадгалах'} className="absolute right-3 top-3 z-20 grid size-9 place-items-center rounded-full border border-[#D6E4FF] bg-white/95 text-[#0B4DBA] shadow-md transition hover:scale-105 hover:bg-[#EFF5FF] focus-visible:outline-2 focus-visible:outline-[#1677FF] disabled:opacity-60">
  {busy?<Loader2 className="size-4 animate-spin"/>:<Heart className="size-5" fill={saved?'#1677FF':'none'}/>}
 </button>
}
export function WishlistPanel(){
 const open=useWishlistStore(s=>s.open),setOpen=useWishlistStore(s=>s.setOpen)
 const items=useWishlistStore(s=>s.items),refresh=useWishlistStore(s=>s.refresh)
 const toggle=useWishlistStore(s=>s.toggle)
 const {customer}=useCustomer()
 const openDetail=useUIStore(s=>s.setSelectedProduct)
 useEffect(()=>{if(open&&customer)void refresh(customer.id)},[open,customer?.id,refresh]) // eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{const onOpen=()=>setOpen(true);window.addEventListener('st-open-wishlist',onOpen);return()=>window.removeEventListener('st-open-wishlist',onOpen)},[setOpen])
 if(!open)return null
 return <div className="fixed inset-0 z-[90] bg-slate-950/40" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
  <aside role="dialog" aria-modal="true" aria-label="Хүслийн жагсаалт" className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-[#D6E4FF] bg-white shadow-2xl">
   <div className="flex items-center justify-between border-b border-[#D6E4FF] p-5"><h2 className="flex items-center gap-2 text-lg font-bold text-[#102A43]"><Heart className="size-5 text-[#1677FF]"/>Хүслийн жагсаалт ({items.length})</h2><button onClick={()=>setOpen(false)} aria-label="Хаах" className="rounded-full p-2 hover:bg-blue-50"><X/></button></div>
   <div className="flex-1 space-y-3 overflow-y-auto p-5">
    {!customer?<p className="text-sm text-slate-600">Хадгалсан бараагаа харахын тулд нэвтэрнэ үү.</p>:items.length===0?<p className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">Одоогоор хадгалсан бараа алга. Бүтээгдэхүүний ❤️ товчийг ашиглаарай.</p>:
    items.map(p=><article key={p.id} className="flex gap-3 rounded-2xl border border-[#D6E4FF] bg-[#F8FBFF] p-3">
      {p.image?<img src={p.image} alt="" className="size-16 rounded-lg object-contain"/>:<div className="grid size-16 place-items-center rounded-lg bg-white text-xs font-bold">{p.name.slice(0,2)}</div>}
      <div className="min-w-0 flex-1"><button className="text-left text-sm font-semibold hover:text-blue-600" onClick={()=>{openDetail(p.id);setOpen(false)}}>{p.name}</button><p className="mt-1 text-sm font-bold text-[#1677FF]">{formatTugrik(p.price)}</p>{p.priceDropped&&<p role="status" className="mt-1 inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">Үнэ буурсан! Өмнө нь {formatTugrik(p.priceWhenSaved||p.price)}</p>}<button className="mt-2 text-xs text-rose-600 underline" onClick={()=>void toggle(p.id).catch(()=>toast.error('Устгаж чадсангүй'))}>Хасах</button></div>
      <button title="Бараа үзэх" aria-label="Бараа үзэх" onClick={()=>{openDetail(p.id);setOpen(false)}} className="self-center rounded-full p-2 hover:bg-blue-100"><ShoppingBag className="size-5"/></button>
    </article>)}
   </div>
  </aside>
 </div>
}
