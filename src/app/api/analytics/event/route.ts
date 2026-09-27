import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
const TYPES=new Set(['product_view','search','add_to_cart','checkout_start','wishlist_add','wishlist_remove'])
const rate=new Map<string,{used:number,until:number}>()
export async function POST(req:NextRequest){
 const length=Number(req.headers.get('content-length')||0)
 if(length>2048)return NextResponse.json({error:'Хэт том хүсэлт'},{status:413})
 const key=(req.headers.get('x-real-ip')||req.headers.get('x-forwarded-for')||'guest').split(',')[0].slice(0,90)
 const now=Date.now(),prev=rate.get(key)
 const current=prev&&prev.until>now?prev:{used:0,until:now+60000}
 if(++current.used>80)return NextResponse.json({error:'Олон хүсэлт илгээлээ'},{status:429})
 rate.set(key,current)
 if(rate.size>3000)rate.clear()
 const b=await req.json().catch(()=>null)
 if(!b||typeof b.type!=='string'||!TYPES.has(b.type))return NextResponse.json({error:'Хүсэлт буруу'},{status:400})
 const productId=typeof b.productId==='string'&&b.productId.length<=120?b.productId:null
 const submitted=typeof b.query==='string'?b.query.trim().slice(0,80):null
 // Never store likely email addresses, phone numbers or payment identifiers as search terms.
 const query=submitted&&!/@|(?:^|\D)\d{7,}(?:\D|$)/.test(submitted)?submitted:null
 if(b.type==='search' && (!query||query.length<2))return NextResponse.json({ok:true})
 if(productId){const exists=await db.product.findUnique({where:{id:productId},select:{id:true}});if(!exists)return NextResponse.json({error:'Бараа олдсонгүй'},{status:400})}
 try {
  await db.analyticsEvent.create({data:{type:b.type,productId,query:b.type==='search'?query:null}})
  return NextResponse.json({ok:true})
 }catch{return NextResponse.json({error:'Бүртгэж чадсангүй'},{status:503})}
}
