import { createRequire } from 'node:module'
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3100'
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Local preview only')
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_EXECUTABLE ? { executablePath: process.env.CHROME_EXECUTABLE } : {}) })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] })
const page = await context.newPage()
const errors = []
page.on('pageerror', error => errors.push(error.message))
const output = process.env.TEST_SCREENSHOTS
if (output) await mkdir(output, { recursive: true })
try {
  await page.goto(base, { waitUntil: 'networkidle' })
  assert.ok(await page.locator('.hero-app').count() > 0)
  assert.notEqual(await page.locator('.hero-app').first().evaluate(el => getComputedStyle(el).animationName), 'none')
  const pause = page.locator('.hero-motion-control')
  await pause.focus()
  await page.keyboard.press('Enter')
  assert.equal(await pause.getAttribute('aria-pressed'), 'true')
  assert.equal(await page.locator('.hero-app').first().evaluate(el => getComputedStyle(el).animationPlayState), 'paused')
  if (output) await page.screenshot({ path: path.join(output, 'storefront-desktop.png') })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  assert.equal(await page.locator('.hero-app').first().evaluate(el => getComputedStyle(el).animationName), 'none')
  assert.equal(await pause.isVisible(), false)
  await page.setViewportSize({ width: 390, height: 844 })
  assert.equal(await page.locator('.catalog-mobile-promo').count(), 0)
  if (output) await page.screenshot({ path: path.join(output, 'storefront-mobile.png') })

  const products = await (await page.request.get(`${base}/api/products`)).json()
  const product = products.find(p => !p.image || p.image.startsWith('/'))
  assert.ok(product, 'A local image or fallback product is required')
  const productPath = `/share/product/${encodeURIComponent(product.id)}`
  const crawlerResponse = await page.request.get(base + productPath, { headers: { 'User-Agent': 'facebookexternalhit/1.1' } })
  assert.equal(crawlerResponse.status(), 200)
  const html = await crawlerResponse.text()
  assert.match(html.split('</head>')[0], /property="og:image"/)
  assert.match(html, /property="og:image:width" content="1200"/)
  assert.match(html, /name="twitter:card" content="summary_large_image"/)
  const image = await page.request.get(base + productPath + '/image')
  assert.equal(image.status(), 200, await image.text().catch(() => 'image response'))
  assert.match(image.headers()['content-type'], /image\/png/)
  const buffer = await image.body()
  assert.equal(buffer.readUInt32BE(16), 1200)
  assert.equal(buffer.readUInt32BE(20), 630)
  if (output) await writeFile(path.join(output, 'facebook-thumbnail.png'), buffer)

  await page.goto(base + productPath, { waitUntil: 'networkidle' })
  assert.equal(await page.locator('h1').textContent(), product.name)
  const share = page.locator('.product-share-facebook').first()
  const shareUrl = new URL(await share.getAttribute('href'))
  assert.equal(new URL(shareUrl.searchParams.get('u')).pathname, productPath)
  await page.getByRole('button', { name: 'Холбоос хуулах', exact: true }).click()
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), shareUrl.searchParams.get('u'))
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Product overflow at ${width}`)
  }
  if (output) await page.screenshot({ path: path.join(output, 'product-mobile.png'), fullPage: true })
  await page.locator('.share-product-buy').click()
  await page.getByRole('dialog').locator('.product-share-facebook').waitFor()
  assert.equal(await page.getByRole('dialog').evaluate(el => el.scrollWidth > el.clientWidth), false)
  await page.keyboard.press('Escape')
  // Next streams the global loading boundary: notFound then renders noindex in a 200 stream.
  const missing = await page.request.get(base + '/share/product/missing-product-id', { headers: { 'User-Agent': 'facebookexternalhit/1.1' } })
  assert.match(await missing.text(), /name="robots" content="noindex"/)
  assert.equal((await page.request.get(base + '/share/product/missing-product-id/image')).status(), 404)
  if (process.env.TEST_ADMIN_PASSWORD) {
    const login = await page.request.post(base + '/api/admin/login', { data: { username: 'preview-admin', password: process.env.TEST_ADMIN_PASSWORD } })
    assert.equal(login.status(), 200)
    assert.equal((await page.request.get(base + '/api/admin/session')).status(), 200, 'Admin session cookie must be accepted')
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto(base + '/admin', { waitUntil: 'domcontentloaded' })
    await page.getByRole('tab', { name: 'Бүтээгдэхүүн', exact: true }).click()
    await page.locator('tbody .product-share-facebook').first().waitFor()
    const row = page.locator('tbody tr').filter({ has: page.locator('.product-share-facebook') }).first()
    await row.getByRole('button', { name: 'Шуурхай засах', exact: true }).click()
    await page.getByRole('dialog').locator('.product-share-facebook').waitFor()
  }
  assert.deepEqual(errors, [])
  console.log('PASS motion pause/reduced-motion, responsive promo/product, crawler metadata, 1200x630 PNG, copy/share targets, purchase modal, missing product noindex/image 404, admin share controls')
} finally { await browser.close() }
