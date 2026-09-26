// Local seeded preview only; admin credentials must be explicitly supplied.
import { createRequire } from 'node:module'
import assert from 'node:assert/strict'
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3100'
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname))
const browser = await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE ? {executablePath:process.env.CHROME_EXECUTABLE} : {})})
const page = await browser.newPage({viewport:{width:1200,height:900}})
const errors=[]
page.on('pageerror',e=>errors.push(e.message))
const name='QA Free Program '+Date.now()
let productId
try {
  const login=await page.request.post(base+'/api/admin/login',{data:{username:process.env.TEST_ADMIN_USERNAME,password:process.env.TEST_ADMIN_PASSWORD}})
  assert.equal(login.status(),200)
  await page.goto(base+'/admin',{waitUntil:'domcontentloaded'})
  await page.getByRole('tab',{name:'Бүтээгдэхүүн',exact:true}).click()
  await page.getByRole('button',{name:'Шинэ бүтээгдэхүүн',exact:true}).click()
  const form=page.getByRole('dialog')
  await form.getByRole('checkbox',{name:'Үнэгүй программ',exact:true}).check()
  await form.getByLabel('Татах URL *',{exact:true}).fill('https://example.org/download')
  await form.getByPlaceholder('Facebook Account Manager Pro').fill(name)
  assert.equal(await form.getByPlaceholder('89000').isDisabled(),true)
  assert.equal(await form.getByLabel('Барааны хугацааны сонголт').isDisabled(),true)
  await form.locator('[data-slot=select-trigger]').first().click()
  await page.getByRole('option').first().click()
  const saved=page.waitForResponse(r=>r.url().endsWith('/api/admin/products')&&r.request().method()==='POST')
  await form.getByRole('button',{name:'Хадгалах',exact:true}).click()
  const response=await saved
  assert.equal(response.status(),200)
  const product=await response.json();productId=product.id
  assert.equal(product.price,0);assert.equal(product.downloadUrl,'https://example.org/download')
  await page.goto(base,{waitUntil:'domcontentloaded'})
  await page.getByRole('navigation',{name:'Ангиллаар шүүх'}).getByRole('button',{name:'Үнэгүй программууд',exact:false}).click()
  const card=page.locator('.shop-product').filter({hasText:name})
  await card.waitFor()
  assert.equal(await card.getByRole('link',{name:'Үнэгүй татах'}).getAttribute('href'),'https://example.org/download')
  assert.equal(await card.getByRole('button',{name:'Сагсанд нэмэх'}).count(),0)
  await card.getByRole('heading',{name}).click()
  const detail=page.getByRole('dialog')
  await detail.getByRole('link',{name:'Үнэгүй татах'}).waitFor()
  assert.equal(await detail.getByRole('button',{name:'Сагсанд нэмэх'}).count(),0)
  await page.keyboard.press('Escape')
  const registered=await page.request.post(base+'/api/auth/register',{data:{name:'QA',phone:'00000000',email:`free-${Date.now()}@example.invalid`,password:'Local-only-test-42!'}})
  assert.equal(registered.status(),200)
  let status='PAID'
  await page.route('**/api/customer/orders',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{id:'qa',orderNumber:'QA-LOCAL',status,statusLabel:status,totalAmount:100,createdAt:new Date().toISOString(),items:[],payment:{status:'PAID',paidAt:new Date().toISOString()}}])}))
  await page.setViewportSize({width:320,height:844})
  await page.reload({waitUntil:'domcontentloaded'})
  await page.getByRole('button',{name:'Цэс',exact:true}).click()
  await page.getByRole('navigation',{name:'Гар утасны цэс'}).getByRole('button',{name:'Миний захиалга',exact:true}).click()
  const account=page.getByRole('dialog')
  await account.getByRole('heading',{name:'Захиалга баталгаажсан',exact:true}).waitFor()
  assert.equal(await account.locator('.order-progress').getAttribute('data-step'),'1')
  status='DELIVERED'
  await account.getByRole('button',{name:'Төлөв шинэчлэх',exact:true}).click()
  await page.waitForFunction(()=>document.querySelector('.order-progress')?.dataset.step==='2')
  assert.equal(await account.evaluate(el=>el.scrollWidth>el.clientWidth),false,JSON.stringify(await account.evaluate(el=>[...el.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().right>el.getBoundingClientRect().right).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent?.slice(0,70)})))))
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,JSON.stringify(await page.evaluate(()=>({width:innerWidth,doc:document.documentElement.scrollWidth,els:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth&&e.getBoundingClientRect().width>0).map(e=>({tag:e.tagName,cls:e.className,right:e.getBoundingClientRect().right})).slice(0,15)}))))
  assert.deepEqual(errors,[])
  console.log('PASS admin free-program save, direct download card/detail, mobile direct order history, paid/delivered refresh, no overflow/browser errors')
} finally {
  if(productId) await page.request.delete(base+'/api/admin/products/'+productId)
  await browser.close()
}
