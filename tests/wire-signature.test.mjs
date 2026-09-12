import { test } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { verifyWebhookSignature, mapIntentStatus, toMinorUnits } from '../src/lib/wire.ts'

const secret = 'whsec_local_test_only'
process.env.WIRE_MN_WEBHOOK_SECRET = secret
const body = JSON.stringify({type: 'endpoint.verification'})
const now = Math.floor(Date.now() / 1000)
const sign = (timestamp, payload = body) => `t=${timestamp},v1=${crypto.createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex')}`
test('accepts documented WirePayment-Signature format', () => assert.equal(verifyWebhookSignature(body, sign(now)), true))
test('rejects tampered body', () => assert.equal(verifyWebhookSignature(body + ' ', sign(now)), false))
test('rejects expired and future deliveries', () => {
  // Use a fresh timestamp here so suite/runtime startup delays cannot move the
  // +301s case back inside the 300-second acceptance window.
  const freshNow = Math.floor(Date.now() / 1000)
  assert.equal(verifyWebhookSignature(body, sign(freshNow - 301)), false)
  assert.equal(verifyWebhookSignature(body, sign(freshNow + 301)), false)
})
test('rejects unsigned, legacy, malformed, and ambiguous signatures', () => {
  for (const signature of ['', crypto.createHmac('sha256', secret).update(body).digest('hex'), `t=${now},v1=zz`, `t=${now},${sign(now)}`, 't=NaN,v1=00']) {
    assert.equal(verifyWebhookSignature(body, signature), false)
  }
})
test('requires configured secret', () => {
  delete process.env.WIRE_MN_WEBHOOK_SECRET
  assert.equal(verifyWebhookSignature(body, sign(now)), false)
  process.env.WIRE_MN_WEBHOOK_SECRET = secret
})
test('preserves whole-tugrik MNT amounts and pending payment behavior', () => {
  assert.equal(toMinorUnits(500), 500)
  assert.equal(mapIntentStatus('requires_payment_method'), 'PENDING')
  assert.equal(mapIntentStatus('succeeded'), 'PAID')
  assert.equal(mapIntentStatus('failed'), 'FAILED')
})
