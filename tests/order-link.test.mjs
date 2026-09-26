import assert from 'node:assert/strict'
import test from 'node:test'
import { isValidOrderLink } from '../src/lib/order-link.ts'

test('order links accept valid HTTPS post and livestream URLs', () => {
  assert.equal(isValidOrderLink('https://www.facebook.com/abc/posts/123'), true)
  assert.equal(isValidOrderLink('  https://www.instagram.com/reel/ABC123/?utm_source=chat  '), true)
  assert.equal(isValidOrderLink('https://youtu.be/liveId'), true)
})

test('order links reject unsafe and malformed addresses', () => {
  for (const value of ['', '   ', 'javascript:alert(1)', 'http://example.com', 'https://', 'https://user:pass@example.com', 'https://example.com/' + 'x'.repeat(2050)]) {
    assert.equal(isValidOrderLink(value), false, value)
  }
})
