'use client'

import { Heart, Loader2, ShoppingBag, Trash2, X } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ProductImage } from './product-illustration'
import { formatTugrik } from '@/lib/format'
import { useWishlist } from '@/hooks/use-wishlist'
import { useUIStore } from '@/store/cart'

export function WishlistDrawer(){
  const open=useUIStore(s=>s.wishlistOpen)
  const close=useUIStore(s=>s.closeWishlist)
  const openAuth=useUIStore(s=>s.openAuth)
  const setSelectedProduct=useUIStore(s=>s.setSelectedProduct)
  const {items,loading,toggle,customer}=useWishlist()
  const view=(id:string)=>{close();setSelectedProduct(id)}
  return <Dialog open={open} onOpenChange={value=>!value&&close()}>
    <DialogContent className="customer-surface sm:max-w-xl p-0 overflow-hidden bg-white border-[#D6E4FF] max-h-[90vh]">
      <DialogTitle className="sr-only">Хүслийн жагсаалт</DialogTitle>
      <DialogDescription className="sr-only">Хадгалсан бүтээгдэхүүнүүд</DialogDescription>
      <div className="flex items-center justify-between border-b border-[#EEF4FF] bg-gradient-to-r from-[#E8F1FF] to-white px-5 py-4">
        <div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-xl bg-[#1677FF] text-white"><Heart className="size-5 fill-current"/></span><div><h2 className="font-extrabold text-[#102A43]">Хүслийн жагсаалт</h2><p className="text-xs text-[#5B7290]">{customer?(items.length+' хадгалсан бүтээгдэхүүн'):'Бүртгэлээрээ нэвтэрнэ үү'}</p></div></div>
        <button type="button" onClick={close} className="grid size-9 place-items-center rounded-full hover:bg-[#E8F1FF]" aria-label="Хаах"><X className="size-5"/></button>
      </div>
      <div className="max-h-[72vh] overflow-y-auto p-4">
        {!customer?<div className="py-14 text-center"><Heart className="mx-auto size-10 text-[#1677FF]"/><h3 className="mt-3 font-bold text-[#102A43]">Дуртай бараагаа хадгалаарай</h3><p className="mx-auto mt-2 max-w-sm text-sm text-[#5B7290]">Нэвтэрсний дараа хүслийн жагсаалт бүх төхөөрөмж дээр тань хадгалагдана.</p><Button className="mt-5 rounded-full" onClick={()=>{close();openAuth('login')}}>Нэвтрэх</Button></div>
        :loading?<div className="grid place-items-center py-16"><Loader2 className="size-7 animate-spin text-[#1677FF]"/></div>
        :items.length===0?<div className="py-14 text-center"><ShoppingBag className="mx-auto size-10 text-[#9BB7D4]"/><h3 className="mt-3 font-bold text-[#102A43]">Одоогоор хоосон байна</h3><p className="mt-2 text-sm text-[#5B7290]">Бүтээгдэхүүний ❤️ товчийг дарж энд хадгална.</p></div>
        :<div className="space-y-3">{items.map(({product})=><div key={product.id} className="flex gap-3 rounded-2xl border border-[#D6E4FF] bg-white p-3 shadow-sm">
          <button type="button" onClick={()=>view(product.id)} className="w-24 shrink-0"><ProductImage image={product.image} icon={product.icon} alt={product.name} category={product.category} mode="icon" className="aspect-[4/3] w-full"/></button>
          <div className="min-w-0 flex-1"><button type="button" onClick={()=>view(product.id)} className="block text-left"><h3 className="line-clamp-2 text-sm font-bold text-[#102A43]">{product.name}</h3><p className="mt-1 text-xs text-[#5B7290]">{product.category}</p></button><div className="mt-2 flex items-center justify-between gap-2"><strong className="text-sm text-[#0B4DBA]">{formatTugrik(product.price)}</strong><button type="button" onClick={()=>void toggle(product.id)} className="grid size-8 place-items-center rounded-full text-red-500 hover:bg-red-50" aria-label="Хүслийн жагсаалтаас хасах"><Trash2 className="size-4"/></button></div></div>
        </div>)}</div>}
      </div>
    </DialogContent>
  </Dialog>
}
