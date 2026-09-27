'use client'
import { create } from 'zustand'

type SavedProduct={id:string;name:string;shortDesc:string;category:string;price:number;oldPrice:number|null;image:string|null;icon:string;available:boolean;slug:string}
type WishlistStore={ids:string[];items:SavedProduct[];ownerId:string|null;open:boolean;busy:boolean;setOpen:(open:boolean)=>void;refresh:(owner:string|null)=>Promise<void>;toggle:(productId:string)=>Promise<boolean>}
export const useWishlistStore=create<WishlistStore>((set,get)=>({
 ids:[],items:[],ownerId:null,open:false,busy:false,
 setOpen:open=>set({open}),
 refresh:async(owner)=>{
  if(!owner){set({ownerId:null,ids:[],items:[],busy:false});return}
  if(owner!==get().ownerId)set({ownerId:owner,ids:[],items:[]})
  try{
   const response=await fetch('/api/customer/wishlist',{cache:'no-store'})
   if(!response.ok)throw Error('wishlist')
   const data=await response.json() as {items:SavedProduct[]}
   if(get().ownerId===owner)set({items:data.items,ids:data.items.map(p=>p.id)})
  }catch{ /* Preserve existing state; the next open can retry. */ }
 },
 toggle:async(productId)=>{
  const old=get(),saved=old.ids.includes(productId)
  if(!old.ownerId)throw Error('Нэвтрэх шаардлагатай')
  if(old.busy)throw Error('Түр хүлээгээд дахин оролдоно уу')
  set({busy:true,ids:saved?old.ids.filter(id=>id!==productId):[...old.ids,productId],items:saved?old.items.filter(p=>p.id!==productId):old.items})
  try{
   const response=await fetch('/api/customer/wishlist'+(saved?'?productId='+encodeURIComponent(productId):''),{
     method:saved?'DELETE':'POST',headers:saved?{}:{'Content-Type':'application/json'},body:saved?undefined:JSON.stringify({productId})
   })
   if(!response.ok)throw Error('Хадгалж чадсангүй')
   await get().refresh(old.ownerId)
   return !saved
  }catch{set({ids:old.ids,items:old.items});throw Error('Хүслийн жагсаалт шинэчилж чадсангүй')}finally{set({busy:false})}
 }
}))
