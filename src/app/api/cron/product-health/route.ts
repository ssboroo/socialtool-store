import { NextRequest,NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { db } from '@/lib/db'
import { productHealth } from '@/lib/product-health'
import { sendTelegramMessage,escapeTelegramHtml } from '@/lib/telegram'
export const dynamic='force-dynamic'
export async function GET(req:NextRequest){
 const secret=process.env.CRON_SECRET
 const supplied=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'')
 if(!secret||secret.length<24||Buffer.byteLength(secret)!==Buffer.byteLength(supplied)||!timingSafeEqual(Buffer.from(secret),Buffer.from(supplied)))return NextResponse.json({error:'Зөвшөөрөлгүй'},{status:401})
 const products=await db.product.findMany()
 const critical=products.map(p=>({name:p.name,issues:productHealth(p).filter(i=>i.severity==='critical')})).filter(p=>p.issues.length)
 const warningCount=products.reduce((sum,p)=>sum+productHealth(p).filter(i=>i.severity==='warning').length,0)
 const lines=['🩺 <b>Socialtool.store бүтээгдэхүүний шалгалт</b>','Нийт: '+products.length,'Ноцтой алдаа: '+critical.reduce((n,p)=>n+p.issues.length,0),'Анхааруулга: '+warningCount]
 for(const p of critical.slice(0,12))lines.push('• '+escapeTelegramHtml(p.name)+': '+escapeTelegramHtml(p.issues.map(i=>i.message).join(', ')))
 if(critical.length>12)lines.push('…Бусад алдааг админ хэсгээс үзнэ үү')
 const sent=await sendTelegramMessage(lines.join('\n'))
 return NextResponse.json({ok:true,checked:products.length,critical:critical.length,warnings:warningCount,telegramSent:sent.ok===true},{headers:{'Cache-Control':'no-store'}})
}
