'use client'
import { useState } from 'react'
import { AlertTriangle, ShieldCheck, Search, RotateCw } from 'lucide-react'
type Issue={code:string;severity:'critical'|'warning'|'info';message:string}
type Health={scanned:number;counts:{critical:number;warning:number;info:number};rows:{id:string;name:string;available:boolean;issues:Issue[]}[];checkedAt:string}
export function AdminProductHealth({token}:{token:string}){
 const [result,setResult]=useState<Health|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState(''),[query,setQuery]=useState('')
 const scan=async()=>{setLoading(true);setError('');try{
  const res=await fetch('/api/admin/product-health',{headers:{authorization:'Bearer '+token},cache:'no-store'})
  if(!res.ok)throw Error('Шалгалт амжилтгүй')
  setResult(await res.json())
 }catch(e){setError(e instanceof Error?e.message:'Алдаа')}finally{setLoading(false)}}
 return <section className="space-y-5 text-[#102A43]">
  <div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-2xl font-bold">Бүтээгдэхүүний шалгагч</h2><p className="text-sm text-slate-500">Зураг, үнэ, тайлбар, лого болон холбоосын форматыг шалгана.</p></div><button disabled={loading} onClick={()=>void scan()} className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"><RotateCw className={'size-4 '+(loading?'animate-spin':'')}/> {result?'Дахин шалгах':'Одоо шалгах'}</button></div>
  {error&&<p role="alert" className="text-rose-600">{error}</p>}
  {result&&<><div className="grid gap-3 sm:grid-cols-4">{[['Нийт',result.scanned],['Ноцтой',result.counts.critical],['Анхаарах',result.counts.warning],['Мэдээлэл',result.counts.info]].map(([label,count])=><div key={label} className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">{label}</p><strong className="text-3xl">{count}</strong></div>)}</div>
   {result.rows.length===0?<p className="flex items-center gap-2 text-green-700"><ShieldCheck/>Бүх шалгалтад тэнцсэн</p>:<><label className="flex items-center gap-2 rounded-xl border bg-white p-3"><Search className="size-4"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Бараа хайх" className="flex-1 outline-none"/></label><div className="space-y-3">{result.rows.filter(row=>row.name.toLowerCase().includes(query.toLowerCase())).map(row=><article key={row.id} className="rounded-2xl border border-[#D6E4FF] bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold">{row.name}</h3><span className="text-xs text-slate-500">{row.available?'Бэлэн':'Түр дууссан'}</span></div><div className="mt-3 flex flex-wrap gap-2">{row.issues.map(issue=><span key={issue.code} className={'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs '+(issue.severity==='critical'?'bg-red-100 text-red-800':issue.severity==='warning'?'bg-amber-100 text-amber-800':'bg-blue-100 text-blue-800')}><AlertTriangle className="size-3"/>{issue.message}</span>)}</div></article>)}</div></>}
   <p className="text-xs text-slate-500">Гаднын URL ажиллаж байгаа эсэхийг аюулгүй байдлын үүднээс автоматаар нээж шалгахгүй. Холбоосын хэлбэрийг шалгана.</p></>}
 </section>
}
