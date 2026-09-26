'use client'
import { useEffect, useRef, useState } from 'react'
type Product={id:string;name:string;available:boolean}
type Preview={productId:string;text:string;image:string|null;url:string;version:string}
type Entry={productId:string;name:string;at:string;status:string;messageId:number|null}
type Config={configured:boolean;channel:string;channelUrl:string;history:Entry[]}
const statuses:Record<string,string>={sent:'Нийтэлсэн',failed:'Илгээж чадсангүй',pending:'Боловсруулж байна / сувгаа шалгана уу',unknown:'Хариу тодорхойгүй — сувгаа шалгана уу'}
export function TelegramPublisher(){
 const [config,setConfig]=useState<Config|null>(null),[products,setProducts]=useState<Product[]>([])
 const [channelUrl,setChannelUrl]=useState(''),[query,setQuery]=useState(''),[id,setId]=useState('')
 const [preview,setPreview]=useState<Preview|null>(null),[photo,setPhoto]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState('')
 const operation=useRef(''),locked=useRef(false)
 async function refresh(){
  const r=await fetch('/api/admin/telegram',{cache:'no-store'}),d=await r.json()
  if(!r.ok)throw new Error(d.error);setConfig(d)
 }
 useEffect(()=>{let active=true
  Promise.all([fetch('/api/admin/telegram').then(r=>{if(!r.ok)throw new Error('Тохиргоо уншсангүй');return r.json()}),fetch('/api/admin/products').then(r=>{if(!r.ok)throw new Error('Бараа уншсангүй');return r.json()})])
  .then(([c,p])=>{if(active){setConfig(c);setChannelUrl(c.channelUrl);setProducts(p)}}).catch(e=>{if(active)setNotice(e.message)})
  return()=>{active=false}
 },[])
 useEffect(()=>{setPreview(null);operation.current='';if(!id)return
  const controller=new AbortController()
  fetch('/api/admin/telegram?productId='+encodeURIComponent(id),{signal:controller.signal}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error);return d})
  .then(d=>{if(!controller.signal.aborted){setPreview(d);setPhoto(!!d.image);operation.current=crypto.randomUUID()}})
  .catch(e=>{if(!controller.signal.aborted)setNotice(e.message)})
  return()=>controller.abort()
 },[id])
 async function save(){
  setBusy(true)
  try{const r=await fetch('/api/admin/telegram',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({channelUrl:channelUrl.trim()})});const d=await r.json();if(!r.ok)throw new Error(d.error);setNotice('Сувгийн холбоос хадгаллаа');await refresh()}catch(e){setNotice(e instanceof Error?e.message:'Алдаа гарлаа')}finally{setBusy(false)}
 }
 async function publish(){
  if(!preview||locked.current)return
  locked.current=true;setBusy(true);setNotice('')
  try{
   const r=await fetch('/api/admin/telegram',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({productId:preview.productId,operationId:operation.current,version:preview.version,withPhoto:photo})})
   const d=await r.json();if(!r.ok)throw new Error(d.error)
   setNotice(d.error||statuses[d.status]||'Түүхээ шалгана уу')
   await refresh()
  }catch(e){setNotice(e instanceof Error?e.message:'Холболт тасарлаа. Суваг болон түүхээ шалгана уу.')}finally{locked.current=false;setBusy(false)}
 }
 const control='w-full rounded-xl border p-3 bg-white text-slate-900 dark:bg-slate-900 dark:text-white'
 return <section className="space-y-5">
 <h2 className="text-2xl font-bold">Telegram суваг</h2>
 <p>Одоогийн бот ашиглана. Ботоо шинэ сувгийн админ болгож нийтлэл оруулах эрх өгнө үү. Серверт TELEGRAM_CHANNEL_ID (@сувгийн_нэр эсвэл -100… ID) тохируулна.</p>
 <div className="rounded-2xl border p-5 space-y-3">
 <label className="block">Сайтын “Telegram сувагт нэгдэх” холбоос<input className={control} value={channelUrl} disabled={busy} onChange={e=>setChannelUrl(e.target.value)} placeholder="https://t.me/your_channel"/></label>
 <button className="rounded-xl bg-blue-600 px-5 py-3 text-white disabled:opacity-50" disabled={busy} onClick={save}>Холбоос хадгалах</button>
 <p>{config?.configured?'Нийтлэх суваг: '+config.channel:'Нийтлэх серверийн тохиргоо дутуу байна.'}</p>
 </div>
 <div className="grid gap-5 lg:grid-cols-2">
 <div className="space-y-3"><label className="block">Бүтээгдэхүүн хайх<input className={control} value={query} onChange={e=>setQuery(e.target.value)} /></label>
 <div className="max-h-96 overflow-auto rounded-xl border">{products.filter(p=>p.available&&p.name.toLowerCase().includes(query.toLowerCase())).map(p=><button key={p.id} disabled={busy} aria-pressed={id===p.id} className={'block w-full border-b p-3 text-left break-words '+(id===p.id?'bg-blue-100 text-blue-950':'')} onClick={()=>setId(p.id)}>{p.name}</button>)}</div></div>
 <div className="rounded-2xl border p-5 space-y-3"><h3 className="font-bold">Нийтлэлийн урьдчилан харах</h3>
 {preview?<><label className="flex items-center gap-2"><input type="checkbox" checked={photo} disabled={busy||!preview.image} onChange={e=>{setPhoto(e.target.checked);operation.current=crypto.randomUUID()}}/>Зурагтай нийтлэх</label>
 {photo&&preview.image&&<img src={preview.image} alt="Нийтлэх бүтээгдэхүүний зураг" className="max-h-48 w-full object-contain"/>}
 <p className="whitespace-pre-wrap break-words">{preview.text}</p>
 <a href={preview.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">Бүтээгдэхүүний холбоос шалгах</a>
 <button className="block rounded-xl bg-blue-600 px-5 py-3 text-white disabled:opacity-50" disabled={busy||!config?.configured} onClick={publish}>{busy?'Хүлээнэ үү…':'Telegram сувагт нийтлэх'}</button>
 <p className="text-sm">Нийтлэх товч дарахад дээрх мэдээлэл сувагт шууд илгээгдэнэ. Давтан товшиход ижил хүсэлтийг дахин илгээхгүй.</p>
 </>:<p>Бүтээгдэхүүн сонгоно уу.</p>}</div></div>
 <p role="status" className="break-words font-medium">{notice}</p>
 <div className="space-y-3"><h3 className="font-bold">Сүүлийн 20 нийтлэлийн түүх</h3>
 <button disabled={busy} className="rounded-xl border px-4 py-3" onClick={()=>refresh().catch(()=>setNotice('Түүх шинэчилж чадсангүй'))}>Түүх шинэчлэх</button>
 {config?.history.map((h,i)=><div key={h.at+i} className="rounded-xl border p-3 break-words"><strong>{h.name}</strong><p>{statuses[h.status]||h.status} · {new Date(h.at).toLocaleString('mn-MN',{timeZone:'Asia/Ulaanbaatar'})}</p>{h.messageId&&<small>Telegram мессеж №{h.messageId}</small>}</div>)}
 <p className="text-sm">Хариу тодорхойгүй эсвэл боловсруулж байгаа бол сувгаа шалгаарай. Автоматаар дахин илгээхгүй.</p></div>
 </section>
}
