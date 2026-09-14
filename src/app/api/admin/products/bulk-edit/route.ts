import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'
import { bulkEditSchema, bulkProductData } from '@/lib/bulk-product-edit'
export async function PUT(req:Request){
  if(!getAdminFromRequest(req))return NextResponse.json({error:'Зөвшөөрөлгүй'},{status:401})
  try {
    const parsed=bulkEditSchema.safeParse(await req.json())
    if(!parsed.success)return NextResponse.json({error:'1–100 бараа болон өөрчлөх талбаруудаа зөв сонгоно уу.'},{status:400})
    const {items,patch}=parsed.data
    await db.$transaction(async tx=>{
      const category=patch.categoryId?await tx.category.findUnique({where:{id:patch.categoryId}}):null
      if(patch.categoryId&&!category)throw new Error('Ангилал олдсонгүй')
      for(const item of items){
        const p=await tx.product.findUnique({where:{id:item.id}})
        if(!p||p.updatedAt.toISOString()!==item.updatedAt)throw new Error('CONFLICT')
        const data=bulkProductData(p,patch,category)
        const changed=await tx.product.updateMany({where:{id:item.id,updatedAt:new Date(item.updatedAt)},data})
        if(changed.count!==1)throw new Error('CONFLICT')
      }
    })
    return NextResponse.json({count:items.length})
  }catch(e){
    if(e instanceof SyntaxError)return NextResponse.json({error:'Хүсэлт буруу байна'},{status:400})
    if(e instanceof Error&&e.message==='CONFLICT')return NextResponse.json({error:'Барааны мэдээлэл өөрчлөгдсөн байна. Жагсаалтаа шинэчилж дахин сонгоно уу. Ямар ч өөрчлөлт хадгалаагүй.'},{status:409})
    if(e instanceof Error&&['Ангилал олдсонгүй','Товч тайлбар 500 тэмдэгтээс хэтэрлээ','Үнийн өөрчлөлт -100%-аас их, 1000%-аас бага байна','Үнэ зөв эерэг бүхэл тоо байх ёстой'].includes(e.message))return NextResponse.json({error:e.message},{status:400})
    return NextResponse.json({error:'Бөөнөөр хадгалах үед алдаа гарлаа. Өөрчлөлт хадгалаагүй.'},{status:500})
  }
}
