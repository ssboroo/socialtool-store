import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/wire'

/** Public reachability check without exposing environment/configuration details. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'socialtool.store webhook',
    callbackUrl: '/api/payment/wire/callback',
    timestamp: new Date().toISOString(),
  }, { headers: { 'Cache-Control': 'no-store' } })
}

/** Check signatures without exposing an HMAC signing oracle. */
export async function POST(req: NextRequest) {
  const raw = await req.text()
  const signature = req.headers.get('wirepayment-signature') || ''
  const match = verifyWebhookSignature(raw, signature)
  return NextResponse.json({ ok: match }, { status: match ? 200 : 401, headers: { 'Cache-Control': 'no-store' } })
}
