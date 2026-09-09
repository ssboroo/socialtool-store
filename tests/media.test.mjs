import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getYouTubeId, parseImageList } from '../src/lib/media.ts'
import { validImageFilename } from '../src/lib/uploads.ts'
import { escapeTelegramHtml, formatOrderNotification } from '../src/lib/telegram.ts'
const id = 'dQw4w9WgXcQ'
test('YouTube watch, short, live, mobile, embed and pasted IDs', () => {
  for (const url of [`https://youtube.com/watch?si=abc&v=${id}`, `https://youtu.be/${id}?si=abc`, `https://m.youtube.com/shorts/${id}`, `https://youtube.com/live/${id}`, `https://www.youtube-nocookie.com/embed/${id}`, ` ${id} `]) assert.equal(getYouTubeId(url), id)
})
test('rejects unrelated hosts and malformed IDs', () => {
  for (const url of [`https://evil.test/watch?v=${id}`, `https://youtube.com.evil.test/watch?v=${id}`, 'https://youtube.com/watch?v=short', 'javascript:alert(1)', `https://youtu.be/${id}extra`]) assert.equal(getYouTubeId(url), null)
})
test('instruction images accept uploaded local images, reject unsafe schemes', () => {
  assert.deepEqual(parseImageList('/uploads/products/abc.webp;https://example.com/a.png\njavascript:alert(1); //evil.test/a.png'), ['/uploads/products/abc.webp', 'https://example.com/a.png'])
})
test('uploaded image filenames cannot escape the storage directory', () => {
  assert.equal(validImageFilename('abc-123.webp'), true)
  for (const filename of ['../secret.png', '%2e%2e.png', 'a.svg', 'a.png/secret']) assert.equal(validImageFilename(filename), false)
})
test('Telegram HTML escapes customer and product text', () => {
  assert.equal(escapeTelegramHtml('<A & B>'), '&lt;A &amp; B&gt;')
  const text = formatOrderNotification({ orderNumber:'1',customerName:'<b>Joe</b>',phone:'123',items:[{name:'A&B',quantity:1,price:1}],total:1,status:'pending' })
  assert.ok(text.includes('&lt;b&gt;Joe&lt;/b&gt;'))
  assert.ok(text.includes('A&amp;B'))
})
