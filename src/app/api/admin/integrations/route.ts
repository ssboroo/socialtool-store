import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { callTelegramApi } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

/** Read-only diagnostics; never returns credentials or sends a message. */
export async function GET(req: NextRequest) {
  if (!getAdminFromRequest(req)) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })
  const checks: { name: string; ok: boolean; detail: string }[] = []
  try {
    await db.customer.count()
    checks.push({ name: 'Бүртгэлийн өгөгдлийн сан', ok: true, detail: 'Хэрэглэгчийн хүснэгт уншигдаж байна' })
  } catch {
    checks.push({ name: 'Бүртгэлийн өгөгдлийн сан', ok: false, detail: 'DATABASE_URL болон Prisma schema-г шалгана уу' })
  }
  const key = process.env.WIRE_MN_API_KEY || ''
  const live = key.startsWith('sk_live_')
  const operators = (process.env.WIRE_MN_ALLOWED_OPERATORS || '').split(',').map(x => x.trim()).filter(Boolean)
  checks.push({ name: 'Төлбөрийн API түлхүүр', ok: /^sk_(live|test)_/.test(key), detail: live ? 'Бодит горим; гүйлгээ хараахан шалгаагүй' : key.startsWith('sk_test_') ? 'Туршилтын горим' : 'WIRE_MN_API_KEY тохируулах шаардлагатай' })
  checks.push({ name: 'Төлбөрийн оператор', ok: live || operators.every(op => op === 'sandbox'), detail: live && operators.includes('sandbox') ? 'Хуучин sandbox утгыг бодит горимд алгасаж, холбогдсон операторыг ашиглана' : 'WIRE_MN_ALLOWED_OPERATORS нь Wire dashboard дахь идэвхтэй операторын ID байх ёстой' })
  checks.push({ name: 'Webhook', ok: !!process.env.WIRE_MN_WEBHOOK_SECRET && !process.env.WIRE_MN_WEBHOOK_SECRET.includes('replace_with'), detail: 'WIRE_MN_WEBHOOK_SECRET тохируулж, Wire dashboard дээр endpoint-оо Verified / Enabled болгоно' })
  checks.push({ name: 'Сайтын хаяг', ok: /^https:\/\//.test(process.env.NEXT_PUBLIC_SITE_URL || ''), detail: 'NEXT_PUBLIC_SITE_URL=https://socialtool.store' })
  try {
    await db.uploadedImage.count()
    checks.push({ name: 'Зургийн хадгалалт', ok: true, detail: 'Шинэ зураг өгөгдлийн санд хадгалагдана. Өгөгдлийн санг persistent volume дээр байрлуулж нөөцөлнө.' })
  } catch {
    checks.push({ name: 'Зургийн хадгалалт', ok: false, detail: 'UploadedImage хүснэгтийн шинэчлэл шаардлагатай. Өгөгдлийн санг нөөцлөөд prisma db push ажиллуулна уу.' })
  }

  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_ADMIN_CHAT_ID) {
    checks.push({ name: 'Telegram', ok: false, detail: 'TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_CHAT_ID тохируулаад ботдоо /start илгээнэ үү' })
  } else {
    const bot = await callTelegramApi('getMe', {})
    const chat = bot.ok ? await callTelegramApi('getChat', { chat_id: process.env.TELEGRAM_ADMIN_CHAT_ID }) : null
    checks.push({ name: 'Telegram', ok: !!bot.ok && !!chat?.ok, detail: !bot.ok ? 'Ботын токен буруу эсвэл Telegram холболт боломжгүй' : !chat?.ok ? 'Админ чат олдсонгүй. Chat ID, /start болон группийн эрхийг шалгана уу.' : 'Бот болон чат олдлоо. Мэдэгдэл илгээгээгүй.' })
  }
  return NextResponse.json({ checks }, { headers: { 'Cache-Control': 'no-store' } })
}
