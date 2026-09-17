// Local, seeded production preview. No production accounts or payment mutations.
import { createRequire } from 'node:module'
import assert from 'node:assert/strict'
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3100'
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Local preview only')
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_EXECUTABLE ? { executablePath: process.env.CHROME_EXECUTABLE } : {}) })
const page = await browser.newPage({ viewport: { width: 1200, height: 1000 }, reducedMotion: 'reduce' })
const errors = []
page.on('pageerror', error => errors.push(error.message))
try {
  await page.goto(base, { waitUntil: 'networkidle' })
  const products = await (await page.request.get(`${base}/api/products?sort=featured`)).json()
  assert.ok(products.length > 8, 'Seed more than eight products for pagination coverage')
  assert.equal(await page.locator('.shop-product').count(), 8)
  const layout = await page.evaluate(() => {
    const hero = document.querySelector('#top').getBoundingClientRect()
    const sidebar = document.querySelector('.catalog-sidebar').getBoundingClientRect()
    return { sameTop: Math.abs(hero.top - sidebar.top) < 2, beside: hero.left >= sidebar.right, columns: getComputedStyle(document.querySelector('.catalog-grid')).gridTemplateColumns.split(' ').length, artLoaded: document.querySelector('.hero-glass-art').naturalWidth > 0 }
  })
  assert.deepEqual(layout, { sameTop: true, beside: true, columns: 4, artLoaded: true })
  assert.match(await page.locator('header img').first().getAttribute('src'), /socialtool-logo\.png/)
  await page.getByRole('button', { name: 'Цааш үзэх', exact: false }).click()
  assert.equal(await page.locator('.shop-product').count(), Math.min(24, products.length))
  await page.locator('.catalog-search select').selectOption('price-asc')
  await page.waitForResponse(response => response.url().includes('/api/products?sort=price-asc'))
  await page.waitForFunction(() => document.querySelectorAll('.shop-product').length === 8)
  for (const width of [1440, 1200, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Page overflow at ${width}px`)
  }
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.getByRole('button', { name: 'Цэс', exact: true }).click()
  await page.getByRole('navigation', { name: 'Гар утасны цэс', exact: true }).getByRole('button', { name: 'Ангилал', exact: true }).click()
  await page.waitForFunction(() => { const box = document.getElementById('categories').getBoundingClientRect(); return box.top >= 60 && box.top < innerHeight - 60 })
  assert.equal(await page.locator('#categories').isVisible(), true)
  assert.deepEqual(errors, [])
  console.log('PASS screenshot composition, unchanged logo, artwork, pagination/filter reset, six responsive widths, mobile category navigation and browser exceptions')
} finally { await browser.close() }
