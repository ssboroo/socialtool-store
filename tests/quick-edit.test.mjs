import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { PrismaClient } from '@prisma/client'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { realpathSync } from 'node:fs'
test('quick edit and bulk API validation, optimistic concurrency, atomic rollback and AI configuration',async()=>{
 const url=process.env.TEST_DATABASE_URL
 assert.ok(url?.startsWith('file:'),'Use an explicit isolated TEST_DATABASE_URL')
 const relativeDatabasePath=path.relative(realpathSync.native(tmpdir()),realpathSync.native(fileURLToPath(url)))
 assert.ok(relativeDatabasePath && !relativeDatabasePath.startsWith('..') && !path.isAbsolute(relativeDatabasePath),'Use a dedicated test database inside the OS temporary directory')
 const db=new PrismaClient({datasources:{db:{url}}})
 const suffix=randomBytes(8).toString('hex'),password=randomBytes(24).toString('hex')
 const child=spawn(process.execPath,['.next/standalone/server.js'],{env:{...process.env,DATABASE_URL:url,JWT_SECRET:randomBytes(32).toString('hex'),ADMIN_USERNAME:suffix,ADMIN_PASSWORD:password,PORT:'3239',HOSTNAME:'127.0.0.1',OPENAI_API_KEY:'',PRODUCT_AI_MODEL:''},stdio:'ignore'})
 const request=(p,o)=>fetch('http://127.0.0.1:3239'+p,o)
 let token=''
 const send=(p,body,auth=true,method='PUT')=>request(p,{method,headers:{'Content-Type':'application/json',...(auth?{authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body)})
 try{
  for(let i=0;i<100;i++){try{await request('/api/admin/session');break}catch{await new Promise(r=>setTimeout(r,100))}}
  const login=await send('/api/admin/login',{username:suffix,password},false,'POST');assert.equal(login.status,200);token=(await login.json()).token
  const c=await db.category.create({data:{name:'Quick test',slug:suffix}})
  const c2=await db.category.create({data:{name:'Changed',slug:suffix+'2'}})
  const create=(n)=>db.product.create({data:{name:n,slug:suffix+n,shortDesc:'original',description:'**Original**',price:100,oldPrice:120,duration:JSON.stringify([{term:'1 жил',price:80},{term:'Хугацаагүй',price:150}]),categoryId:c.id,category:c.name}})
  const a=await create('A'),b=await create('B')
  assert.equal((await send(`/api/admin/products/${a.id}`,{name:'Changed',expectedUpdatedAt:a.updatedAt.toISOString()},false)).status,401)
  const r=await send(`/api/admin/products/${a.id}`,{name:'Edited',description:'**Bold**\n\n- One',expectedUpdatedAt:a.updatedAt.toISOString()});assert.equal(r.status,200);const edited=await r.json();assert.equal(edited.description,'**Bold**\n\n- One')
  assert.equal((await send(`/api/admin/products/${a.id}`,{name:'Stale',expectedUpdatedAt:a.updatedAt.toISOString()})).status,409)
  const items=[{id:a.id,updatedAt:edited.updatedAt},{id:b.id,updatedAt:b.updatedAt.toISOString()}]
  const body={items,patch:{categoryId:c2.id,available:false,featured:true,shortDescTemplate:'{name} · {category}',price:{mode:'percent',value:50,includeVariants:true}}}
  assert.equal((await send('/api/admin/products/bulk-edit',body,false)).status,401)
  assert.equal((await send('/api/admin/products/bulk-edit',{...body,items:[items[0],items[0]]})).status,400)
  assert.equal((await send('/api/admin/products/bulk-edit',{...body,patch:{price:{mode:'set',value:0,includeVariants:false}}})).status,400)
  // First update must roll back if second snapshot conflicts.
  assert.equal((await send('/api/admin/products/bulk-edit',{...body,items:[items[0],{...items[1],updatedAt:'2000-01-01T00:00:00.000Z'}]})).status,409)
  assert.equal((await db.product.findUnique({where:{id:a.id}})).price,100)
  assert.equal((await send('/api/admin/products/bulk-edit',body)).status,200)
  const done=await db.product.findUnique({where:{id:a.id}})
  assert.equal(done.price,150);assert.equal(done.oldPrice,null);assert.equal(done.discount,null);assert.equal(done.available,false);assert.equal(done.featured,true);assert.equal(done.category,'Changed');assert.equal(done.shortDesc,'Edited · Changed');assert.deepEqual(JSON.parse(done.duration).map(x=>x.price),[120,225])
  // Replaying a bulk request must not compound percentage changes.
  assert.equal((await send('/api/admin/products/bulk-edit',body)).status,409)
  assert.equal((await db.product.findUnique({where:{id:a.id}})).price,150)
  const ai={action:'translate',name:'A',description:'test',shortDesc:'',features:''}
  assert.equal((await send('/api/admin/products/assist',ai,false,'POST')).status,401)
  assert.equal((await send('/api/admin/products/assist',{...ai,action:'invalid'},true,'POST')).status,400)
  assert.equal((await send('/api/admin/products/assist',ai,true,'POST')).status,503)
  console.log('Verified edit conflicts, bulk atomic rollback, percentages and variant prices, templates, replay protection, AI auth/configuration')
 }finally{child.kill('SIGTERM');await db.$disconnect()}
})
