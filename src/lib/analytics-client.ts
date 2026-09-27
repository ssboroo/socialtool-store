'use client'
const TYPES=new Set(['product_view','search','add_to_cart','checkout_start','wishlist_add','wishlist_remove'])
export function trackStoreEvent(type:string,productId?:string,query?:string){
 if(!TYPES.has(type))return
 // Only minimal anonymous event data. Never send user details, cookies or session IDs.
 void fetch('/api/analytics/event',{method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({type,productId,query}),keepalive:true,credentials:'omit'}).catch(()=>{})
}
