import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { smartSearch } from '@/lib/smart-search'

export async function GET(req:NextRequest) {
  const query=(new URL(req.url).searchParams.get('q')||'').trim().slice(0,100)
  if(!query)return NextResponse.json({products:[]})
  const products=await db.product.findMany({where:{available:true},select:{id:true,name:true,shortDesc:true,category:true,price:true,image:true,icon:true,featured:true,rating:true,slug:true},take:2000})
  const results=smartSearch(products,query,30)
  return NextResponse.json({products:results},{headers:{'Cache-Control':'no-store'}})
}
