import { NextRequest, NextResponse } from 'next/server'

/**
 * Demo-confirm endpoint.
 *
 * This endpoint existed for the old mock Wire.mn flow. Now that a real
 * WIRE_MN_API_KEY (sk_live_...) is configured, the demo flow is disabled.
 * Payments are confirmed exclusively through:
 *   1. The signed webhook at /api/payment/wire/callback, OR
 *   2. The status polling endpoint at /api/payment/wire/status which queries
 *      the Wire.mn API directly (server-side source of truth).
 *
 * This endpoint refuses to run when a real key is present.
 */
export async function POST(req: NextRequest) {
  const key = process.env.WIRE_MN_API_KEY
  const hasRealKey = key && key !== 'your_wire_mn_api_key'
  if (hasRealKey) {
    return NextResponse.json(
      { error: 'Бодит Wire.mn key тохируулсан тул demo-confirm идэвхгүй. Төлбөр webhook-оор эсвэл status polling-оор баталгаажна.' },
      { status: 403 }
    )
  }
  return NextResponse.json({ error: 'Demo горим идэвхгүй' }, { status: 403 })
}
