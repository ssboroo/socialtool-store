import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCustomerFromRequest } from '@/lib/auth'

function auth(req:NextRequest){return getCustomerFromRequest(req)}
export async function GET(req:NextRequest){
  const customer=auth(req);if(!customer)return NextResponse.json({error:'Нэвтэрнэ үү'},{status:401})
  const rows=await db.wishlist.findMany({
    where:{customerId:customer.sub},
    include:{product:true},
    orderBy:{createdAt:'desc'}
  })
  return NextResponse.json({items:rows.filter(r=>r.product.available).map(r=>({
    id:r.id,createdAt:r.createdAt,product:{
      id:r.product.id,name:r.product.name,slug:r.product.slug,shortDesc:r.product.shortDesc,price:r.product.price,
      oldPrice:r.product.oldPrice,image:r.product.image,icon:r.product.icon,category:r.product.category,
      available:r.product.available,duration:r.product.duration,requiresOrderLink:r.product.requiresOrderLink,
      rating:r.product.rating,reviewCount:r.product.reviewCount,discount:r.product.discount,description:r.product.description,
      features:r.product.features,tutorialVideoUrl:r.product.tutorialVideoUrl,instructionImages:r.product.instructionImages,downloadUrl:r.product.downloadUrl
    }
  }))},{headers:{'Cache-Control':'private, no-store'}})
}
export async function POST(req:NextRequest){
  const customer=auth(req);if(!customer)return NextResponse.json({error:'Нэвтэрнэ үү'},{status:401})
  const body=await req.json();if(typeof body.productId!=='string')return NextResponse.json({error:'Бараа буруу байна'},{status:400})
  const product=await db.product.findUnique({where:{id:body.productId},select:{id:true,available:true}})
  if(!product?.available)return NextResponse.json({error:'Бүтээгдэхүүн олдсонгүй'},{status:404})
  const row=await db.wishlist.upsert({where:{customerId_productId:{customerId:customer.sub,productId:product.id}},create:{customerId:customer.sub,productId:product.id},update:{}})
  return NextResponse.json({ok:true,id:row.id})
}
export async function DELETE(req:NextRequest){
  const customer=auth(req);if(!customer)return NextResponse.json({error:'Нэвтэрнэ үү'},{status:401})
  const productId=new URL(req.url).searchParams.get('productId')
  if(!productId)return NextResponse.json({error:'Бараа буруу байна'},{status:400})
  await db.wishlist.deleteMany({where:{customerId:customer.sub,productId}})
  return NextResponse.json({ok:true})
}
