'use client'

import { create } from 'zustand'
import { useEffect } from 'react'
import { useCustomer } from '@/hooks/use-customer'
import type { Product } from '@/components/site/product-card'
import { trackEvent } from '@/lib/analytics-client'

type WishlistItem={id:string;createdAt:string;product:Product}
type State={
  ownerId:string|null
  loaded:boolean
  loading:boolean
  items:WishlistItem[]
  set:(value:Partial<State>)=>void
}
const store=create<State>(set=>({ownerId:null,loaded:false,loading:false,items:[],set}))

async function loadFor(customerId:string){
  const current=store.getState()
  if(current.loading || (current.loaded&&current.ownerId===customerId))return
  store.getState().set({loading:true,ownerId:customerId})
  try{
    const res=await fetch('/api/customer/wishlist',{cache:'no-store'})
    if(!res.ok)throw new Error()
    const data=await res.json()
    if(store.getState().ownerId===customerId)store.getState().set({items:Array.isArray(data.items)?data.items:[],loaded:true,loading:false})
  }catch{if(store.getState().ownerId===customerId)store.getState().set({loading:false})}
}

export function useWishlist(){
  const {customer,loading:customerLoading}=useCustomer()
  const state=store()
  useEffect(()=>{
    if(customerLoading)return
    if(!customer){store.getState().set({ownerId:null,items:[],loaded:true,loading:false});return}
    void loadFor(customer.id)
  },[customer?.id,customerLoading])

  const has=(productId:string)=>state.items.some(item=>item.product.id===productId)
  const toggle=async(productId:string)=>{
    if(!customer)return 'login' as const
    const removing=has(productId)
    const res=await fetch(removing?('/api/customer/wishlist?productId='+encodeURIComponent(productId)):'/api/customer/wishlist',{
      method:removing?'DELETE':'POST',
      headers:removing?undefined:{'Content-Type':'application/json'},
      body:removing?undefined:JSON.stringify({productId}),
    })
    if(!res.ok)return 'error' as const
    store.getState().set({loaded:false})
    await loadFor(customer.id)
    trackEvent(removing?'wishlist_remove':'wishlist_add',{productId})
    return removing?'removed' as const:'added' as const
  }
  const refresh=async()=>{if(customer){store.getState().set({loaded:false});await loadFor(customer.id)}}
  return {items:state.items,loading:state.loading||customerLoading,count:state.items.length,has,toggle,refresh,customer}
}
