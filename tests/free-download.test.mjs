import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseDownloadUrl, validProductOffer } from '../src/lib/free-download.ts'

test('free download URLs require HTTPS and reject executable/credential URLs', () => {
  assert.equal(parseDownloadUrl(' https://example.org/download?version=2 '), 'https://example.org/download?version=2')
  assert.equal(parseDownloadUrl(null), null)
  for (const value of ['javascript:alert(1)', 'data:text/html,hi', '//example.org/file', 'http://example.org/file', 'https://user:secret@example.org/file', 'https://', 123]) assert.equal(parseDownloadUrl(value), undefined)
})
test('free offers cannot expose a paid download or contain paid license options', () => {
  assert.equal(validProductOffer(0, 'https://example.org/file', null, null), true)
  assert.equal(validProductOffer(100, null, null, null), true)
  for (const offer of [[0, null, null, null], [100, 'https://example.org/file', null, null], [0, 'https://example.org/file', '1 жил', null], [0, 'https://example.org/file', null, 100]]) assert.equal(validProductOffer(...offer), false)
})
