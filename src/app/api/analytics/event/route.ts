import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
const TYPES=new Set(['product_view','search','add_to_cart','checkout_start','wishlist_add','wishlist_remove'])
export async function POST(req:NextRequest){
 const length=Number(req.headers.get('content-length')||0)
 if(length>2048)return NextResponse.json({error:'Хэт том хүсэлт'},{status:413})
 const b=await req.json().catch(()=>null)
 if(!b||typeof b.type!=='string'||!TYPES.has(b.type))return NextResponse.json({error:'Хүсэлт буруу'},{status:400})
 const productId=typeof b.productId==='string'&&b.productId.length<=120?b.productId:null
 const query=typeof b.query==='string'?b.query.trim().slice(0,80):null
 if(b.type==='search' && (!query||query.length<2))return NextResponse.json({ok:true})
 if(productId){const exists=await db.product.findUnique({where:{id:productId},select:{id:true}});if(!exists)return NextResponse.json({error:'Бараа олдсонгүй'},{status:400})}
 try {
  await db.analyticsEvent.create({data:{type:b.type,productId,query:b.type==='search'?query:null}})
  return NextResponse.json({ok:true})
 }catch{return NextResponse.json({error:'Бүртгэж чадсангүй'},{status:503})}
}
