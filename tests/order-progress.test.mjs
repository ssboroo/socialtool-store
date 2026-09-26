import { test } from 'node:test'
import assert from 'node:assert/strict'
import { orderProgress } from '../src/lib/order-progress.ts'
test('order confirmation follows server payment/fulfillment and cancellation wins', () => {
  for (const state of ['NEW', 'PENDING_PAYMENT']) assert.equal(orderProgress(state, 'PENDING').step, 0)
  assert.equal(orderProgress('PENDING_PAYMENT', 'FAILED').step, 0)
  assert.equal(orderProgress('PAID', 'PAID').title, 'Захиалга баталгаажсан')
  assert.equal(orderProgress('PENDING_PAYMENT', 'PAID').step, 1)
  assert.equal(orderProgress('DELIVERED', 'PAID').step, 2)
  assert.equal(orderProgress('CANCELLED', 'PAID').step, -1)
})
