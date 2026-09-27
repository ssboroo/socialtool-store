import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCustomerFromRequest } from '@/lib/auth'
import { validAnalyticsType } from '@/lib/analytics'

function text(value:unknown,max:number){return typeof value==='string'&&value.trim().length<=max?value.trim():null}
export async function POST(req:NextRequest){
  try{
    const body=await req.json()
    if(!validAnalyticsType(body.type)) return NextResponse.json({error:'Үйлдлийн төрөл буруу байна'},{status:400})
    const sessionId=text(body.sessionId,120)
    if(!sessionId) return NextResponse.json({error:'Session буруу байна'},{status:400})
    const customer=getCustomerFromRequest(req)
    const productId=text(body.productId,120)
    const query=text(body.query,200)
    const meta=body.meta==null?null:JSON.stringify(body.meta)
    if(meta&&meta.length>4000)return NextResponse.json({error:'Meta хэт урт байна'},{status:400})
    let safeProductId:string|null=null
    if(productId){
      const product=await db.product.findUnique({where:{id:productId},select:{id:true}})
      if(product)safeProductId=product.id
    }
    await db.analyticsEvent.create({data:{
      type:body.type,sessionId,customerId:customer?.sub||null,productId:safeProductId,
      query:query||null,value:Number.isSafeInteger(body.value)?body.value:null,meta
    }})
    return NextResponse.json({ok:true})
  }catch{return NextResponse.json({error:'Analytics хадгалж чадсангүй'},{status:400})}
}
