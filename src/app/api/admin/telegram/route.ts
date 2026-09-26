import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'
import { channelPost, validChannelUrl } from '@/lib/telegram-channel'
const prefix='private.telegram.post.'
async function preview(id:string) {
  const p=await db.product.findUnique({where:{id}})
  if(!p||!p.available) return null
  const origin=new URL(process.env.NEXT_PUBLIC_SITE_URL||'https://socialtool.store')
  if(origin.protocol!=='https:') throw new Error('site URL')
  const url=new URL('/',origin);url.searchParams.set('product',p.id)
  let image:string|null=null
  if(p.image) { try { const u=new URL(p.image,origin);if(u.protocol==='https:'&&!u.username&&!u.password) image=u.href } catch {} }
  const text=channelPost(p)
  const version=createHash('sha256').update(JSON.stringify([text,image,url.href,(process.env.TELEGRAM_CHANNEL_ID||'@socialtoolstore')])).digest('hex')
  return {productId:p.id,text,image,url:url.href,version}
}
export async function GET(req:NextRequest) {
  if(!getAdminFromRequest(req)) return NextResponse.json({error:'Зөвшөөрөлгүй'},{status:401})
  try {
    const id=req.nextUrl.searchParams.get('productId')
    if(id) { const data=await preview(id);return NextResponse.json(data||{error:'Бэлэн бүтээгдэхүүн олдсонгүй'},{status:data?200:404}) }
    const [setting,rows]=await Promise.all([
      db.siteSetting.findUnique({where:{key:'telegramChannelUrl'}}),
      db.siteSetting.findMany({where:{key:{startsWith:prefix}},orderBy:{updatedAt:'desc'},take:20})
    ])
    return NextResponse.json({configured:!!process.env.TELEGRAM_BOT_TOKEN&&!!(process.env.TELEGRAM_CHANNEL_ID||'@socialtoolstore'),channel:(process.env.TELEGRAM_CHANNEL_ID||'@socialtoolstore')||'',channelUrl:setting?.value??'https://t.me/socialtoolstore',history:rows.map(r=>JSON.parse(r.value))})
  } catch { return NextResponse.json({error:'Telegram мэдээлэл уншиж чадсангүй'},{status:500}) }
}
export async function PUT(req:NextRequest) {
  if(!getAdminFromRequest(req)) return NextResponse.json({error:'Зөвшөөрөлгүй'},{status:401})
  try {
    const {channelUrl}=await req.json()
    if(!validChannelUrl(channelUrl)) return NextResponse.json({error:'https://t.me/сувгийн_нэр эсвэл урилгын холбоос оруулна уу'},{status:400})
    await db.siteSetting.upsert({where:{key:'telegramChannelUrl'},create:{key:'telegramChannelUrl',value:channelUrl},update:{value:channelUrl}})
    return NextResponse.json({ok:true})
  } catch { return NextResponse.json({error:'Хадгалж чадсангүй'},{status:500}) }
}
export async function POST(req:NextRequest) {
  if(!getAdminFromRequest(req)) return NextResponse.json({error:'Зөвшөөрөлгүй'},{status:401})
  let body
  try {body=await req.json()} catch {return NextResponse.json({error:'Хүсэлт буруу'},{status:400})}
  if(!body||typeof body.productId!=='string'||typeof body.operationId!=='string'||!/^[0-9a-f-]{36}$/i.test(body.operationId)||typeof body.version!=='string'||typeof body.withPhoto!=='boolean') return NextResponse.json({error:'Хүсэлт буруу'},{status:400})
  const token=process.env.TELEGRAM_BOT_TOKEN,chat=(process.env.TELEGRAM_CHANNEL_ID||'@socialtoolstore')
  if(!token||!chat||!/^(@[A-Za-z][A-Za-z0-9_]{4,31}|-100\d+)$/.test(chat)) return NextResponse.json({error:'TELEGRAM_BOT_TOKEN / TELEGRAM_CHANNEL_ID тохируулна уу'},{status:400})
  const key=prefix+body.operationId
  try {
    const old=await db.siteSetting.findUnique({where:{key}})
    if(old) return NextResponse.json(JSON.parse(old.value))
    const p=await preview(body.productId)
    if(!p||p.version!==body.version) return NextResponse.json({error:'Бүтээгдэхүүн өөрчлөгдсөн байна. Урьдчилан харах хэсгийг шинэчилнэ үү.'},{status:409})
    if(body.withPhoto&&!p.image) return NextResponse.json({error:'Бүтээгдэхүүн зураггүй байна'},{status:400})
    const record={productId:p.productId,name:p.text.split('\n')[0],at:new Date().toISOString(),status:'pending',messageId:null as number|null}
    try { await db.siteSetting.create({data:{key,value:JSON.stringify(record)}}) }
    catch { return NextResponse.json({error:'Энэ хүсэлт бүртгэгдсэн байна. Түүхээ шинэчилж шалгана уу.'},{status:409}) }
    let result
    try {
      const res=await fetch('https://api.telegram.org/bot'+token+'/'+(body.withPhoto?'sendPhoto':'sendMessage'),{
        method:'POST',signal:AbortSignal.timeout(15000),headers:{'Content-Type':'application/json'},
        body:JSON.stringify({chat_id:chat,...(body.withPhoto?{photo:p.image,caption:p.text}:{text:p.text,link_preview_options:{is_disabled:true}}),reply_markup:{inline_keyboard:[[{text:'Бүтээгдэхүүн үзэх',url:p.url}]]}})
      })
      result=await res.json()
    } catch {
      record.status='unknown'
      await db.siteSetting.update({where:{key},data:{value:JSON.stringify(record)}})
      return NextResponse.json(record)
    }
    record.status=result.ok?'sent':'failed'
    record.messageId=result.ok?result.result?.message_id:null
    await db.siteSetting.update({where:{key},data:{value:JSON.stringify(record)}})
    return NextResponse.json({...record,...(!result.ok?{error:'Telegram хүлээж авсангүй. Ботын сувгийн нийтлэх эрх, зураг болон илгээх хязгаарыг шалгана уу.'}:{})})
  } catch { return NextResponse.json({error:'Алдаа гарлаа. Дахин нийтлэхээс өмнө түүх болон сувгаа шалгана уу.'},{status:500}) }
}
