// Run after next build against an isolated SQLite schema, never production.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { randomBytes } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { PrismaClient } from '@prisma/client'

test('local production API: registration, admin, image upload and account-isolated carts', async () => {
  const databaseUrl = process.env.TEST_DATABASE_URL
  assert.ok(databaseUrl?.startsWith('file:/tmp/'), 'Requires explicit isolated file:/tmp/ TEST_DATABASE_URL')
  const suffix = randomBytes(6).toString('hex')
  const password = randomBytes(24).toString('hex')
  const uploads = await mkdtemp(path.join(tmpdir(), 'socialtool-uploads-'))
  const wireMock = createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json')
    const id = req.url.split('/').pop()
    res.end(JSON.stringify({ id, status: 'succeeded', currency: 'MNT', amount: id === 'pi_wrong_amount' ? 1 : 300 }))
  })
  await new Promise(resolve => wireMock.listen(0, '127.0.0.1', resolve))
  const wireUrl = `http://127.0.0.1:${wireMock.address().port}/v1`
  const server = spawn(process.execPath, ['.next/standalone/server.js'], {
    env: { ...process.env, DATABASE_URL: databaseUrl, JWT_SECRET: randomBytes(32).toString('hex'), ADMIN_USERNAME: `admin-${suffix}`, ADMIN_PASSWORD: password, PORT: '3217', HOSTNAME: '127.0.0.1', UPLOAD_DIR: uploads, TELEGRAM_BOT_TOKEN: '', TELEGRAM_ADMIN_CHAT_ID: '', WIRE_MN_API_KEY: 'sk_test_local_mock_only', WIRE_MN_API_URL: wireUrl, WIRE_MN_ALLOWED_OPERATORS: '', WIRE_MN_WEBHOOK_SECRET: '', NEXT_PUBLIC_SITE_URL: 'http://127.0.0.1:3217' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let logs = ''
  server.stdout.on('data', b => { logs += b })
  server.stderr.on('data', b => { logs += b })
  const db = new PrismaClient({ datasources: { db: { url: databaseUrl } } })
  const base = 'http://127.0.0.1:3217'
  const request = (route, options) => fetch(base + route, options)
  const json = (data, cookie) => ({ method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) }, body: JSON.stringify(data) })
  const cookieOf = res => res.headers.get('set-cookie')?.split(';')[0]
  try {
    for (let i = 0; i < 60; i++) {
      try { if ((await request('/api/payment/wire/test')).ok) break } catch {}
      if (server.exitCode !== null) throw new Error('Server failed to start: ' + logs)
      await new Promise(r => setTimeout(r, 250))
    }
    const register = email => request('/api/auth/register', json({ name: 'Local Test', phone: '00000000', email, password }))
    const a = await register(`a-${suffix}@example.invalid`)
    assert.equal(a.status, 200)
    const accountA = (await a.json()).customer
    const cookieA = cookieOf(a)
    assert.ok(cookieA)
    assert.equal((await register(`a-${suffix}@example.invalid`)).status, 409)
    assert.equal((await register('not-an-email')).status, 400)
    const b = await register(`b-${suffix}@example.invalid`)
    assert.equal(b.status, 200)
    const cookieB = cookieOf(b)
    assert.equal((await request('/api/auth/me', { headers: { cookie: cookieA } })).status, 200)
    const admin = await request('/api/admin/login', json({ username: `admin-${suffix}`, password }))
    assert.equal(admin.status, 200)
    const token = (await admin.json()).token
    const adminHeaders = { authorization: `Bearer ${token}` }
    assert.equal((await request('/api/admin/session', { headers: adminHeaders })).status, 200)
    assert.equal((await request('/api/admin/session', { headers: { authorization: 'Bearer invalid' } })).status, 401)
    assert.equal((await request('/api/admin/products', { headers: adminHeaders })).status, 200)
    assert.equal((await request('/api/admin/integrations')).status, 401)
    const health = await request('/api/admin/integrations', { headers: adminHeaders })
    assert.equal(health.status, 200)
    assert.equal((await health.json()).checks.find(c => c.name === 'Telegram').ok, false)

    const category = await db.category.create({ data: { name: 'Local', slug: suffix, icon: 'Package' } })
    const product = await db.product.create({ data: { name: 'Local Test Product', duration: '1 жил;Хугацаагүй', slug: suffix, shortDesc: 'Test', description: '## Test\n\n- Item one\n- Item two', price: 100, category: category.name, categoryId: category.id } })
    const png = await sharp({ create: { width: 16, height: 16, channels: 3, background: '#1677ff' } }).png().toBuffer()
    const form = new FormData()
    form.append('file', new Blob([png], { type: 'image/png' }), 'test.png')
    assert.equal((await request('/api/admin/products/upload', { method: 'POST', body: form })).status, 401)
    const uploaded = await request('/api/admin/products/upload', { method: 'POST', headers: adminHeaders, body: form })
    assert.equal(uploaded.status, 200)
    const uploadedUrl = (await uploaded.json()).url
    const image = await request(uploadedUrl)
    assert.equal(image.status, 200)
    assert.equal(image.headers.get('content-type'), 'image/webp')
    const storedImage = await db.uploadedImage.findUnique({ where: { filename: uploadedUrl.split('/').pop() } })
    assert.ok(storedImage.bytes.length > 0)
    assert.equal((await request(`/api/admin/products/${product.id}`, { ...json({ image: uploadedUrl }), method: 'PUT', headers: { ...adminHeaders, 'Content-Type': 'application/json' } })).status, 200)
    assert.equal((await (await request(`/api/products/${product.id}`)).json()).image, uploadedUrl)
    assert.equal((await request('/api/admin/settings', { ...json({ heroImage: uploadedUrl }), method: 'PUT', headers: { ...adminHeaders, 'Content-Type': 'application/json' } })).status, 200)
    assert.equal((await (await request('/api/settings')).json()).heroImage, uploadedUrl)
    assert.equal((await request('/api/admin/settings', { ...json({ heroImage: 'javascript:alert(1)' }), method: 'PUT', headers: { ...adminHeaders, 'Content-Type': 'application/json' } })).status, 400)
    assert.equal((await request('/api/chat/messages', json({ sessionId:'x', sender:'admin', content:'spoof' }))).status, 400)
    // A fresh server process with a different empty upload directory reads the same DB image.
    const freshUploads = await mkdtemp(path.join(tmpdir(), 'socialtool-fresh-'))
    const secondServer = spawn(process.execPath, ['.next/standalone/server.js'], { env: { ...process.env, DATABASE_URL: databaseUrl, PORT: '3218', HOSTNAME: '127.0.0.1', UPLOAD_DIR: freshUploads }, stdio: 'ignore' })
    try {
      let secondImage
      for (let i=0;i<60;i++) {
        try { secondImage = await fetch('http://127.0.0.1:3218'+uploadedUrl); break } catch { await new Promise(r=>setTimeout(r,100)) }
      }
      assert.equal(secondImage?.status,200)
      assert.equal(secondImage.headers.get('content-type'),'image/webp')
    } finally { secondServer.kill('SIGTERM'); await rm(freshUploads, { recursive:true, force:true }) }
    console.log('Verified DB image survives fresh process/empty upload directory; product and hero persistence; invalid hero and admin chat spoof rejected')
    const invalid = new FormData()
    invalid.append('file', new Blob(['not an image'], { type: 'image/png' }), 'bad.png')
    assert.equal((await request('/api/admin/products/upload', { method: 'POST', headers: adminHeaders, body: invalid })).status, 400)

    assert.equal((await request('/api/customer/cart')).status, 401)
    const cartA = await (await request('/api/customer/cart', { headers: { cookie: cookieA } })).json()
    assert.equal(cartA.version, 0)
    const payload = { ownerId: accountA.id, version: 0, items: [{ id: product.id, quantity: 2 }] }
    const save = await request('/api/customer/cart', { ...json(payload, cookieA), method: 'PUT' })
    assert.equal(save.status, 200)
    assert.equal((await request('/api/customer/cart', { ...json(payload, cookieA), method: 'PUT' })).status, 409)
    assert.equal((await request('/api/customer/cart', { ...json(payload, cookieB), method: 'PUT' })).status, 403)
    assert.deepEqual((await (await request('/api/customer/cart', { headers: { cookie: cookieB } })).json()).items, [])
    const loginAgain = await request('/api/auth/login', json({ email: accountA.email, password }))
    assert.equal(loginAgain.status, 200)
    const secondDeviceCart = await (await request('/api/customer/cart', { headers: { cookie: cookieOf(loginAgain) } })).json()
    assert.equal(secondDeviceCart.items[0].quantity, 2)
    assert.equal(secondDeviceCart.items[0].price, 100)
    const variants = [{ id: product.id, duration: '1 жил', quantity: 1 }, { id: product.id, duration: 'Хугацаагүй', quantity: 2 }]
    assert.equal((await request('/api/customer/cart', { ...json({ ownerId: accountA.id, version: 1, items: variants }, cookieA), method: 'PUT' })).status, 200)
    const synced = await (await request('/api/customer/cart', { headers: { cookie: cookieOf(loginAgain) } })).json()
    assert.deepEqual(synced.items.map(i => i.duration), ['1 жил', 'Хугацаагүй'])
    const orderPayload = { customerName: 'Local Test', phone: '00000000', email: accountA.email, items: variants.map(i => ({ productId: i.id, duration: i.duration, quantity: i.quantity, price: 100, name: 'untrusted name' })) }
    const ordered = await request('/api/orders', json(orderPayload, cookieA))
    assert.equal(ordered.status, 200)
    const order = await db.order.findUnique({ where: { id: (await ordered.json()).orderId }, include: { items: true } })
    assert.equal(order.totalAmount, 300)
    assert.deepEqual(order.items.map(i => i.productName).sort(), ['Local Test Product — 1 жил', 'Local Test Product — Хугацаагүй'].sort())
    orderPayload.items[0].duration = 'invalid'
    assert.equal((await request('/api/orders', json(orderPayload, cookieA))).status, 400)
    console.log('Verified: two license variants sync between sessions; order retains authoritative name, term and total; invalid term rejected')
    assert.ok(order.chatSessionId)
    assert.equal(await db.chatMessage.count({where:{sessionId:order.chatSessionId,sender:'system'}}),0)
    const payment = await db.payment.create({ data: { orderId: order.id, amount: 300, wirePaymentIntentId: 'pi_wrong_amount' } })
    assert.equal((await request('/api/payment/wire/status?orderId='+order.id)).status,502)
    assert.equal((await db.payment.findUnique({ where:{id:payment.id} })).status,'PENDING')
    await db.payment.update({ where:{id:payment.id}, data:{wirePaymentIntentId:'pi_correct'} })
    const confirmed = await request('/api/payment/wire/status?orderId='+order.id)
    assert.equal(confirmed.status,200)
    assert.equal((await confirmed.json()).status,'PAID')
    await db.order.update({ where:{id:order.id}, data:{status:'DELIVERED'} })
    await request('/api/payment/wire/status?orderId='+order.id)
    assert.equal((await db.order.findUnique({where:{id:order.id}})).status,'DELIVERED')
    const systemMessages = await db.chatMessage.findMany({where:{sessionId:order.chatSessionId,sender:'system'}})
    assert.equal(systemMessages.length,1)
    assert.ok(systemMessages[0].content.includes(order.orderNumber))
    const notices = await (await request('/api/customer/notifications', {headers:{cookie:cookieA}})).json()
    assert.equal(notices.notifications.length, 1)
    const notice = notices.notifications[0]
    assert.equal(notice.orderNumber, order.orderNumber)
    assert.equal(notice.readAt, null)
    assert.equal((await request('/api/customer/notifications')).status,401)
    assert.equal((await (await request('/api/customer/notifications',{headers:{cookie:cookieB}})).json()).notifications.length,0)
    await request('/api/customer/notifications',{...json({ids:[notice.id]},cookieB),method:'PATCH'})
    assert.equal((await db.chatMessage.findUnique({where:{id:notice.id}})).customerReadAt,null)
    assert.equal((await request('/api/customer/notifications',{...json({ids:[notice.id]},cookieA),method:'PATCH'})).status,200)
    const restoredNotices = await (await request('/api/customer/notifications',{headers:{cookie:cookieOf(loginAgain)}})).json()
    assert.ok(restoredNotices.notifications[0].readAt)
    console.log('Verified notifications persist across sessions, mark read, reject unauthenticated access and isolate customers')
    console.log('Verified: wrong payment amount cannot fulfill; valid amount confirms; delivered order does not regress')
    const pricedDuration = JSON.stringify([{ term: '1 жил', price: 120 }, { term: 'Хугацаагүй', price: 250 }])
    assert.equal((await request('/api/admin/products/' + product.id, { ...json({ duration: pricedDuration }), method: 'PUT', headers: { ...adminHeaders, 'Content-Type': 'application/json' } })).status, 200)
    const pricedCart = await (await request('/api/customer/cart', { headers: { cookie: cookieA } })).json()
    assert.deepEqual(pricedCart.items.map(i => i.price), [120, 250])
    const pricedPayload = { ...orderPayload, items: variants.map((i, n) => ({ productId: i.id, duration: i.duration, quantity: i.quantity, price: n ? 250 : 120, name: 'ignored' })) }
    const pricedOrder = await request('/api/orders', json(pricedPayload, cookieA))
    assert.equal(pricedOrder.status, 200)
    assert.equal((await pricedOrder.json()).amount, 620)
    pricedPayload.items[0].price = 1
    assert.equal((await request('/api/orders', json(pricedPayload, cookieA))).status, 400)
    assert.equal((await request('/api/admin/products/' + product.id, { ...json({ duration: JSON.stringify([{ term: '1 жил', price: -1 }]) }), method: 'PUT', headers: { ...adminHeaders, 'Content-Type': 'application/json' } })).status, 400)
    const slides = JSON.stringify([uploadedUrl, uploadedUrl])
    assert.equal((await request('/api/admin/settings', { ...json({ heroImages: slides }), method: 'PUT', headers: { ...adminHeaders, 'Content-Type': 'application/json' } })).status, 200)
    assert.equal((await (await request('/api/settings')).json()).heroImages, slides)
    assert.equal((await request('/api/admin/settings', { ...json({ heroImages: '["javascript:alert(1)"]' }), method: 'PUT', headers: { ...adminHeaders, 'Content-Type': 'application/json' } })).status, 400)
    console.log('Verified: per-term prices persist, carts refresh, authoritative order total and tamper rejection; slideshow settings persist and reject unsafe paths')
    await db.product.update({ where:{id:product.id}, data:{duration:null} })
    const pieceCart = await (await request('/api/customer/cart', {headers:{cookie:cookieA}})).json()
    assert.equal(pieceCart.items.length,1)
    assert.equal(pieceCart.items[0].duration,'')
    assert.equal(pieceCart.items[0].quantity,3)
    const pieceOrder = { customerName:'Local Test', phone:'00000000',email:accountA.email,items:[{productId:product.id,name:'ignored',price:100,quantity:12,duration:''}] }
    const placed = await request('/api/orders',json(pieceOrder,cookieA))
    assert.equal(placed.status,200)
    assert.equal((await placed.json()).amount,1200)
    pieceOrder.items[0].duration='1 жил'
    assert.equal((await request('/api/orders',json(pieceOrder,cookieA))).status,400)
    console.log('Verified admin disabling license terms merges cart lines; piece quantity total; disabled term rejected')
    const logout = await request('/api/admin/session', { method: 'DELETE', headers: adminHeaders })
    assert.match(logout.headers.get('set-cookie'), /Max-Age=0/i)
    console.log('Verified: registration, duplicate rejection, login, admin session, upload/read, invalid image, two-device cart and account isolation')
  } finally {
    server.kill('SIGTERM')
    wireMock.close()
    await db.$disconnect()
    await rm(uploads, { recursive: true, force: true })
  }
})
