import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCustomerFromRequest } from '@/lib/auth'
export const dynamic='force-dynamic'

export async function GET(req:NextRequest){
 const customer=getCustomerFromRequest(req)
 if(!customer)return NextResponse.json({error:'Нэвтэрнэ үү'},{status:401})
 const rows=await db.wishlistItem.findMany({where:{customerId:customer.sub},include:{product:{select:{id:true,name:true,shortDesc:true,category:true,price:true,oldPrice:true,image:true,icon:true,available:true,slug:true}}},orderBy:{createdAt:'desc'}})
 return NextResponse.json({items:rows.map(r=>({...r.product,savedAt:r.createdAt}))},{headers:{'Cache-Control':'private, no-store'}})
}
export async function POST(req:NextRequest){
 const customer=getCustomerFromRequest(req)
 if(!customer)return NextResponse.json({error:'Нэвтэрнэ үү'},{status:401})
 const body=await req.json().catch(()=>null)
 if(!body||typeof body.productId!=='string'||body.productId.length>120)return NextResponse.json({error:'Бараа буруу байна'},{status:400})
 const product=await db.product.findUnique({where:{id:body.productId},select:{id:true,available:true}})
 if(!product||!product.available)return NextResponse.json({error:'Бараа олдсонгүй'},{status:404})
 await db.wishlistItem.upsert({where:{customerId_productId:{customerId:customer.sub,productId:body.productId}},create:{customerId:customer.sub,productId:body.productId},update:{}})
 return NextResponse.json({saved:true})
}
export async function DELETE(req:NextRequest){
 const customer=getCustomerFromRequest(req)
 if(!customer)return NextResponse.json({error:'Нэвтэрнэ үү'},{status:401})
 const productId=new URL(req.url).searchParams.get('productId')
 if(!productId||productId.length>120)return NextResponse.json({error:'Бараа буруу байна'},{status:400})
 await db.wishlistItem.deleteMany({where:{customerId:customer.sub,productId}})
 return NextResponse.json({saved:false})
}
