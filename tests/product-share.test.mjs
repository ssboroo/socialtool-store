import { test } from 'node:test'
import assert from 'node:assert/strict'
import { productPath, facebookShareUrl, externalShareImage } from '../src/lib/share-link.ts'

test('stable product URLs and Facebook target preserve encoded IDs', () => {
  assert.equal(productPath('a/b ?Монгол'), '/share/product/a%2Fb%20%3F%D0%9C%D0%BE%D0%BD%D0%B3%D0%BE%D0%BB')
  const target = 'https://socialtool.store/products/abc'
  const share = new URL(facebookShareUrl(target))
  assert.equal(share.origin, 'https://www.facebook.com')
  assert.equal(share.searchParams.get('u'), target)
})

test('external thumbnails only expose public HTTPS images without credentials', () => {
  assert.equal(externalShareImage('https://cdn.example.com/product.jpg'), 'https://cdn.example.com/product.jpg')
  for (const value of [null, '/uploads/products/photo.webp', 'javascript:alert(1)', 'data:image/png,x', 'https://user:secret@example.com/x', 'http://example.com/x', 'https://localhost/a', 'https://127.0.0.1/a']) {
    assert.equal(externalShareImage(value), null)
  }
})
