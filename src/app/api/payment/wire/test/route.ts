import { NextRequest, NextResponse } from 'next/server'

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

/** Echo back the signed payload so the merchant can test their signature setup. */
export async function POST(req: NextRequest) {
  const raw = await req.text()
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require('crypto')
  const secret = process.env.WIRE_MN_WEBHOOK_SECRET || ''
  const computed = secret ? crypto.createHmac('sha256', secret).update(raw).digest('hex') : null
  const sent =
    req.headers.get('wire-signature') ||
    req.headers.get('x-wire-signature') ||
    req.headers.get('x-signature') ||
    req.headers.get('signature') ||
    ''
  return NextResponse.json({
    ok: true,
    receivedBodyPreview: raw.slice(0, 200),
    sentSignature: sent ? sent.slice(0, 32) + '…' : null,
    computedSignature: computed ? computed.slice(0, 32) + '…' : null,
    match: !!(sent && computed && sent === computed),
    hasSecret: !!secret && secret !== 'whsec_replace_with_your_endpoint_signing_secret',
    hint: 'match=true бол гарын үсэг зөв тохируулсан. match=false бол WIRE_MN_WEBHOOK_SECRET-ийг шалгана уу.',
  })
}
