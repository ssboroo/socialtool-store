import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { smartSearch } from '@/lib/smart-search'

export async function GET(req:NextRequest){
  const q=(new URL(req.url).searchParams.get('q')||'').trim().slice(0,120)
  if(!q) return NextResponse.json({query:'',results:[]})
  const products=await db.product.findMany({
    where:{available:true},
    select:{id:true,name:true,slug:true,shortDesc:true,description:true,category:true,features:true,price:true,oldPrice:true,image:true,icon:true,featured:true,available:true,duration:true},
  })
  const results=smartSearch(products,q,10).map(p=>({
    id:p.id,name:p.name,slug:p.slug,shortDesc:p.shortDesc,category:p.category,price:p.price,oldPrice:p.oldPrice,image:p.image,icon:p.icon,duration:p.duration
  }))
  return NextResponse.json({query:q,results},{headers:{'Cache-Control':'no-store'}})
}
