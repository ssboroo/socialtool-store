import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/wire'

/**
 * Public webhook test endpoint — used by the merchant to confirm the site is
 * reachable from the internet before configuring the webhook in the Wire.mn
 * dashboard.
 *
 * Visiting /api/payment/wire/test in a browser (GET) returns a simple JSON
 * status. POSTing a fake signed payload here (with the WIRE_MN_WEBHOOK_SECRET)
 * echoes what the real callback would do — useful to verify the signing secret
 * is set up correctly.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'socialtool.store webhook',
    message: 'Endpoint хүрч байна ✓',
    callbackUrl: '/api/payment/wire/callback',
    hasWebhookSecret: !!(process.env.WIRE_MN_WEBHOOK_SECRET && process.env.WIRE_MN_WEBHOOK_SECRET !== 'whsec_replace_with_your_endpoint_signing_secret'),
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || '(not set)',
    timestamp: new Date().toISOString(),
  })
}

/** Check signatures without exposing an HMAC signing oracle. */
export async function POST(req: NextRequest) {
  const raw = await req.text()
  const signature = req.headers.get('wirepayment-signature') || ''
  const match = verifyWebhookSignature(raw, signature)
  return NextResponse.json({ ok: match, match }, { status: match ? 200 : 401 })
}
