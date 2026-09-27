import { NextRequest,NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'
export async function GET(req:NextRequest){
 if(!getAdminFromRequest(req))return NextResponse.json({error:'Зөвшөөрөлгүй'},{status:401})
 const days=Math.min(90,Math.max(1,Number(new URL(req.url).searchParams.get('days')||30)||30))
 const from=new Date(Date.now()-days*86400000)
 const [events,paid,topWishlist]=await Promise.all([
  db.analyticsEvent.findMany({where:{createdAt:{gte:from}},select:{type:true,query:true,productId:true,createdAt:true},take:40000}),
  db.order.findMany({where:{createdAt:{gte:from},OR:[{status:{in:['PAID','DELIVERED']}},{payment:{status:'PAID'}}]},include:{items:true}}),
  db.wishlistItem.groupBy({by:['productId'],_count:{_all:true},orderBy:{_count:{productId:'desc'}},take:10})
 ])
 const counts:Record<string,number>={}
 const productStats=new Map<string,{views:number;cart:number;wishlist:number}>()
 const search=new Map<string,number>()
 const byDay=new Map<string,{day:string;views:number;cart:number;paid:number}>()
 const ensure=(day:string)=>{let row=byDay.get(day);if(!row){row={day,views:0,cart:0,paid:0};byDay.set(day,row)}return row}
 for(const e of events){
  counts[e.type]=(counts[e.type]||0)+1
  const day=e.createdAt.toISOString().slice(0,10),r=ensure(day)
  if(e.type==='product_view')r.views++
  if(e.type==='add_to_cart')r.cart++
  if(e.type==='search'&&e.query){const q=e.query.toLowerCase().trim();search.set(q,(search.get(q)||0)+1)}
  if(e.productId){const p=productStats.get(e.productId)||{views:0,cart:0,wishlist:0};if(e.type==='product_view')p.views++;if(e.type==='add_to_cart')p.cart++;if(e.type==='wishlist_add')p.wishlist++;productStats.set(e.productId,p)}
 }
 let revenue=0
 const ordersByProduct=new Map<string,{units:number;revenue:number}>()
 for(const order of paid){
  revenue+=order.totalAmount;ensure(order.createdAt.toISOString().slice(0,10)).paid++
  for(const item of order.items){const prev=ordersByProduct.get(item.productId)||{units:0,revenue:0};prev.units+=item.quantity;prev.revenue+=item.quantity*item.price;ordersByProduct.set(item.productId,prev)}
 }
 const topIds=[...new Set([...productStats.keys(),...ordersByProduct.keys(),...topWishlist.map(x=>x.productId)])]
 const names=await db.product.findMany({where:{id:{in:topIds}},select:{id:true,name:true}})
 const lookup=new Map(names.map(p=>[p.id,p.name]))
 const topProducts=topIds.map(id=>({id,name:lookup.get(id)||'Устгасан бараа',...(productStats.get(id)||{views:0,cart:0,wishlist:0}),wishlistCurrent:topWishlist.find(x=>x.productId===id)?._count._all||0,orders:ordersByProduct.get(id)?.units||0,revenue:ordersByProduct.get(id)?.revenue||0}))
  .sort((a,b)=>b.revenue-a.revenue||b.views-a.views).slice(0,20)
 return NextResponse.json({days,counts,paidOrders:paid.length,revenue,averageOrderValue:paid.length?Math.round(revenue/paid.length):0,
  searchTop:[...search].sort((a,b)=>b[1]-a[1]).slice(0,12).map(([query,count])=>({query,count})),
  topProducts,byDay:[...byDay.values()].sort((a,b)=>a.day.localeCompare(b.day))},
 {headers:{'Cache-Control':'private, no-store'}})
}
