import { NextRequest, NextResponse } from 'next/server'
import { createHash, timingSafeEqual } from 'node:crypto'
import { db } from '@/lib/db'
import { productHealthReport } from '@/lib/product-health-report'
import { escapeTelegramHtml, sendTelegramMessage } from '@/lib/telegram'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function scan(req: NextRequest) {
  const secret = process.env.PRODUCT_HEALTH_CRON_SECRET?.trim()
  if (!secret || secret.length < 24) return NextResponse.json({ error: 'CRON secret тохируулаагүй' }, { status: 503 })
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || ''
  const a = Buffer.from(secret), b = Buffer.from(token)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })

  const report = await productHealthReport()
  const fingerprint = createHash('sha256').update(
    report.issues.filter(issue => issue.severity !== 'info').map(issue => issue.productId + ':' + issue.code).sort().join('|'),
  ).digest('hex')
  const last = await db.siteSetting.findUnique({ where: { key: 'private.productHealthDigest' } })
  if (!report.totals.critical && !report.totals.warning && last?.value !== fingerprint) {
    await db.siteSetting.upsert({
      where: { key: 'private.productHealthDigest' },
      create: { key: 'private.productHealthDigest', value: fingerprint },
      update: { value: fingerprint },
    })
  }
  if (report.totals.critical + report.totals.warning && last?.value !== fingerprint) {
    const notable = report.issues.slice(0, 6).map(issue =>
      '• ' + escapeTelegramHtml(issue.name) + ' — ' + escapeTelegramHtml(issue.message)).join('\n')
    const result = await sendTelegramMessage(
      '🔎 <b>Socialtool.store барааны шалгалт</b>\n' +
      'Шалгасан: ' + report.productCount + '\nНоцтой: ' + report.totals.critical +
      '\nАнхааруулга: ' + report.totals.warning + '\n' + notable + '\nАдмин → Бүтээгдэхүүний чанар',
    )
    if (result && 'ok' in result && result.ok) {
      await db.siteSetting.upsert({
        where: { key: 'private.productHealthDigest' },
        create: { key: 'private.productHealthDigest', value: fingerprint },
        update: { value: fingerprint },
      })
      return NextResponse.json({ ...report, notified: true })
    }
  }
  return NextResponse.json({ ...report, notified: false })
}

export async function GET(req: NextRequest) { return scan(req) }
export async function POST(req: NextRequest) { return scan(req) }
