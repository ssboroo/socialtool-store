import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'
import { inspectProduct } from '@/lib/product-health'

export async function GET(req:NextRequest){
  if(!getAdminFromRequest(req))return NextResponse.json({error:'Зөвшөөрөлгүй'},{status:401})
  const products=await db.product.findMany({orderBy:{updatedAt:'desc'}})
  const issues=products.flatMap(inspectProduct)
  const summary={
    products:products.length,
    healthy:products.filter(p=>!issues.some(i=>i.productId===p.id)).length,
    critical:issues.filter(i=>i.severity==='critical').length,
    warning:issues.filter(i=>i.severity==='warning').length,
    info:issues.filter(i=>i.severity==='info').length,
  }
  return NextResponse.json({summary,issues},{headers:{'Cache-Control':'no-store'}})
}
