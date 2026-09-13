import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/auth'
import { db } from '@/lib/db'
const defaultImage = /^\/products\/default\/(instagram|facebook|tiktok|twitter|windows|office|adobe|vpn|ai|generic)\.svg$/
export async function PUT(req: NextRequest) {
  if (!getAdminFromRequest(req)) return NextResponse.json({error:'Зөвшөөрөлгүй'}, {status:401})
  const body = await req.json().catch(() => null)
  const rows = body?.items
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > 100 || rows.some(r => !r || typeof r.id !== 'string' || typeof r.image !== 'string' || !(r.previousImage === null || typeof r.previousImage === 'string')) || new Set(rows.map(r=>r.id)).size !== rows.length) return NextResponse.json({error:'1–100 бүтээгдэхүүн сонгоно уу.'},{status:400})
  for (const row of rows) {
    if (defaultImage.test(row.image)) continue
    const match = row.image.match(/^\/uploads\/products\/([A-Za-z0-9_-]+\.webp)$/)
    if (!match || !await db.uploadedImage.findUnique({where:{filename:match[1]},select:{filename:true}})) return NextResponse.json({error:'Шинэ зургийг файл сонгох хэсгээс оруулна уу.'},{status:400})
  }
  try {
    await db.$transaction(async tx => {
      for (const row of rows) {
        const result = await tx.product.updateMany({where:{id:row.id,image:row.previousImage},data:{image:row.image}})
        if (result.count !== 1) throw new Error('IMAGE_CONFLICT')
      }
    })
    return NextResponse.json({updated:rows.length})
  } catch (e) {
    if (e instanceof Error && e.message === 'IMAGE_CONFLICT') return NextResponse.json({error:'Бүтээгдэхүүн устсан эсвэл зураг нь өөрчлөгдсөн байна. Жагсаалтаа шинэчилж дахин сонгоно уу. Ямар ч зураг солиогүй.'},{status:409})
    return NextResponse.json({error:'Зураг хадгалахад алдаа гарлаа. Дахин оролдоно уу.'},{status:500})
  }
}
