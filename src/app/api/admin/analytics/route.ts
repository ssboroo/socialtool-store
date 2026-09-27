import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export async function GET(req:NextRequest){
  if(!getAdminFromRequest(req))return NextResponse.json({error:'Зөвшөөрөлгүй'},{status:401})
  const url=new URL(req.url)
  const days=Math.max(1,Math.min(90,Number(url.searchParams.get('days'))||30))
  const since=new Date(Date.now()-days*86400000)
  const [events,paidOrders,wishlistCount]=await Promise.all([
    db.analyticsEvent.findMany({where:{createdAt:{gte:since}},select:{type:true,productId:true,query:true,sessionId:true,createdAt:true}}),
    db.order.findMany({where:{createdAt:{gte:since},status:{in:['PAID','DELIVERED']}},select:{id:true,totalAmount:true,items:{select:{productId:true,productName:true,quantity:true}}}}),
    db.wishlist.count()
  ])
  const eventCounts:Record<string,number>={}
  const productViews=new Map<string,number>();const cartAdds=new Map<string,number>();const wishes=new Map<string,number>();const searches=new Map<string,number>()
  for(const e of events){
    eventCounts[e.type]=(eventCounts[e.type]||0)+1
    if(e.productId){
      const map=e.type==='product_view'?productViews:e.type==='add_to_cart'?cartAdds:e.type==='wishlist_add'?wishes:null
      if(map)map.set(e.productId,(map.get(e.productId)||0)+1)
    }
    if(e.type==='search'&&e.query){const key=e.query.toLowerCase();searches.set(key,(searches.get(key)||0)+1)}
  }
  const ids=[...new Set([...productViews.keys(),...cartAdds.keys(),...wishes.keys()])]
  const products=ids.length?await db.product.findMany({where:{id:{in:ids}},select:{id:true,name:true}}):[]
  const names=new Map(products.map(p=>[p.id,p.name]))
  const purchased=new Map<string,{name:string,qty:number}>()
  let revenue=0,units=0
  for(const order of paidOrders){revenue+=order.totalAmount;for(const item of order.items){units+=item.quantity;const cur=purchased.get(item.productId)||{name:item.productName,qty:0};cur.qty+=item.quantity;purchased.set(item.productId,cur)}}
  const rank=(map:Map<string,number>)=>[...map.entries()].map(([productId,count])=>({productId,name:names.get(productId)||'Устсан бүтээгдэхүүн',count})).sort((a,b)=>b.count-a.count).slice(0,10)
  const sessions=new Set(events.map(e=>e.sessionId)).size
  const checkout=eventCounts.begin_checkout||0
  const paid=paidOrders.length
  return NextResponse.json({
    days,revenue,paidOrders:paid,units,sessions,wishlistCount,
    conversionRate:checkout?Math.round(paid/checkout*1000)/10:0,
    events:eventCounts,
    topViewed:rank(productViews),topCart:rank(cartAdds),topWishlisted:rank(wishes),
    topPurchased:[...purchased.entries()].map(([productId,v])=>({productId,name:v.name,count:v.qty})).sort((a,b)=>b.count-a.count).slice(0,10),
    topSearches:[...searches.entries()].map(([query,count])=>({query,count})).sort((a,b)=>b.count-a.count).slice(0,15)
  },{headers:{'Cache-Control':'no-store'}})
}
