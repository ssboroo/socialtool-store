import { NextRequest,NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'
import { productHealth } from '@/lib/product-health'
export async function GET(req:NextRequest){
 if(!getAdminFromRequest(req))return NextResponse.json({error:'Зөвшөөрөлгүй'},{status:401})
 const products=await db.product.findMany()
 const duplicate=new Map<string,number>()
 for(const p of products){const key=p.name.normalize('NFKC').trim().toLowerCase();duplicate.set(key,(duplicate.get(key)||0)+1)}
 const rows=products.map(p=>{
   const issues=productHealth(p)
   if((duplicate.get(p.name.normalize('NFKC').trim().toLowerCase())||0)>1)issues.push({code:'duplicate',severity:'warning' as const,message:'Ижил нэртэй бараа давхардсан'})
   return{id:p.id,name:p.name,available:p.available,issues}
 })
 const counts={critical:rows.reduce((n,r)=>n+r.issues.filter(i=>i.severity==='critical').length,0),warning:rows.reduce((n,r)=>n+r.issues.filter(i=>i.severity==='warning').length,0),info:rows.reduce((n,r)=>n+r.issues.filter(i=>i.severity==='info').length,0)}
 return NextResponse.json({scanned:products.length,counts,rows:rows.filter(r=>r.issues.length).sort((a,b)=>b.issues.filter(i=>i.severity==='critical').length-a.issues.filter(i=>i.severity==='critical').length),checkedAt:new Date().toISOString()},
 {headers:{'Cache-Control':'private, no-store'}})
}
