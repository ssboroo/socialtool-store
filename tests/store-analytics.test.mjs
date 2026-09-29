import test from 'node:test'
import assert from 'node:assert/strict'
import { trackStoreEvent } from '../src/lib/store-analytics.ts'

test('public tracking sends no events while the public preference control is removed', () => {
  const original = globalThis.fetch
  let calls = 0
  globalThis.fetch = () => { calls++; return Promise.resolve({ ok: true }) }
  try {
    for (const type of ['product_view', 'cart_add', 'checkout_start', 'search']) trackStoreEvent(type, { productId: 'test' })
    assert.equal(calls, 0)
  } finally { globalThis.fetch = original }
})
