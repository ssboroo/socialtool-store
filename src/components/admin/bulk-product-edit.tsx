'use client'
import { useState } from 'react'
import { Dialog,DialogContent,DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { bulkProductData, type BulkPatch } from '@/lib/bulk-product-edit'
import { formatTugrik } from '@/lib/format'
import type { QuickProduct } from './quick-product-editor'
import { toast } from 'sonner'
export function BulkProductEdit({products,categories,token,onClose,onSaved}:{products:QuickProduct[];categories:{id:string;name:string}[];token:string;onClose:()=>void;onSaved:()=>void}){
  const [categoryId,setCategory]=useState(''),[available,setAvailable]=useState(''),[featured,setFeatured]=useState('')
  const [priceMode,setPriceMode]=useState(''),[value,setValue]=useState(''),[variants,setVariants]=useState(false)
  const [templateEnabled,setTemplateEnabled]=useState(false),[template,setTemplate]=useState('')
  const [saving,setSaving]=useState(false)
  const [approved,setApproved]=useState(false)
  const patch:BulkPatch={...(categoryId?{categoryId}:{}),...(available?{available:available==='true'}:{}),...(featured?{featured:featured==='true'}:{}),...(templateEnabled?{shortDescTemplate:template}:{}),...(priceMode?{price:{mode:priceMode==='set'?'set':'percent',value:priceMode==='decrease'?-Number(value):Number(value),includeVariants:variants}}:{})}
  let error='',rows:{p:QuickProduct;next:Record<string,unknown>}[]=[]
  try{if(priceMode&&(!value.trim()||!Number.isFinite(Number(value))||Number(value)<=0))throw new Error('0-ээс их дүн оруулна уу');rows=products.map(p=>({p,next:bulkProductData(p,patch,categories.find(c=>c.id===categoryId))}))}catch(e){error=e instanceof Error?e.message:'Алдаа'}
  const save=async()=>{
    if(saving||error||!approved||!Object.keys(patch).length)return
    setSaving(true)
    try{const r=await fetch('/api/admin/products/bulk-edit',{method:'PUT',headers:{'Content-Type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify({items:products.map(p=>({id:p.id,updatedAt:p.updatedAt})),patch})});const d=await r.json();if(!r.ok)throw new Error(d.error);toast.success(`${d.count} бараа шинэчлэгдлээ`);onSaved()}catch(e){toast.error(e instanceof Error?e.message:'Алдаа')}finally{setSaving(false)}
  }
  return <Dialog open onOpenChange={o=>{if(!o&&!saving)onClose()}}><DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto"><DialogTitle>{products.length} бүтээгдэхүүнийг бөөнөөр засах</DialogTitle>
    <fieldset disabled={saving} onChange={()=>setApproved(false)} className="grid gap-4 sm:grid-cols-2">
      <label>Ангилал<select className="block w-full rounded border bg-background p-2" value={categoryId} onChange={e=>setCategory(e.target.value)}><option value="">Өөрчлөхгүй</option>{categories.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label>
      <label>Бэлэн эсэх<select className="block w-full rounded border bg-background p-2" value={available} onChange={e=>setAvailable(e.target.value)}><option value="">Өөрчлөхгүй</option><option value="true">Бэлэн</option><option value="false">Дууссан</option></select></label>
      <label>Онцлох<select className="block w-full rounded border bg-background p-2" value={featured} onChange={e=>setFeatured(e.target.value)}><option value="">Өөрчлөхгүй</option><option value="true">Онцлох</option><option value="false">Онцлохгүй</option></select></label>
      <label>Үнэ<select className="block w-full rounded border bg-background p-2" value={priceMode} onChange={e=>setPriceMode(e.target.value)}><option value="">Өөрчлөхгүй</option><option value="set">Ижил үнэ тогтоох (₮)</option><option value="increase">Үнийг хувиар нэмэх (+%)</option><option value="decrease">Үнийг хувиар бууруулах (−%)</option></select></label>
      {priceMode&&<><label>{priceMode==='set'?'Шинэ үнэ (₮)':priceMode==='increase'?'Нэмэх хувь (%)':'Бууруулах хувь (%)'}<Input type="number" min={priceMode==='set'?1:0.01} max={priceMode==='decrease'?99.99:priceMode==='increase'?1000:undefined} step={priceMode==='set'?1:0.01} placeholder="10" value={value} onChange={e=>setValue(e.target.value)}/></label><label className="self-center"><input type="checkbox" checked={variants} onChange={e=>setVariants(e.target.checked)}/> 1 жил / Хугацаагүй зэрэг эрхийн хувилбарын үнэд мөн үйлчлэх</label><p className="text-xs text-muted-foreground sm:col-span-2">Хуучин үнэ шинэ үнээс бага буюу тэнцүү бол хуучин үнэ, хямдралын тэмдэглэгээг цэвэрлэнэ. Хувийг одоогийн үнээс тооцож бүхэл төгрөгт тоймлоно. Жишээ: 100,000₮-ийг 10% нэмбэл 110,000₮; 10% бууруулбал 90,000₮.</p></>}
      <div className="sm:col-span-2"><label><input type="checkbox" checked={templateEnabled} onChange={e=>setTemplateEnabled(e.target.checked)}/> Товч тайлбарыг загвараар солих</label>{templateEnabled&&<><Input maxLength={500} value={template} onChange={e=>setTemplate(e.target.value)} placeholder="{name} — {category}"/><p className="text-xs">{'{name}'}: нэр, {'{category}'}: ангилал. Хоосон бол сонгосон барааны товч тайлбарыг арилгана.</p></>}</div>
    </fieldset>
    {error&&<p role="alert" className="text-red-600">{error}</p>}
    <div className="max-h-64 overflow-auto rounded border"><table className="w-full text-sm"><thead><tr><th className="p-2 text-left">Бараа</th><th className="p-2 text-left">Өөрчлөлтийн урьдчилсан харагдац</th></tr></thead><tbody>{rows.map(({p,next})=><tr className="border-t" key={p.id}><td className="p-2">{p.name}</td><td className="p-2">{next.price!==undefined&&<p>{formatTugrik(p.price)} → {formatTugrik(next.price as number)}</p>}{next.category!==undefined&&<p>Ангилал: {String(next.category)}</p>}{next.available!==undefined&&<p>{next.available?'Бэлэн':'Дууссан'}</p>}{next.featured!==undefined&&<p>{next.featured?'Онцлох':'Онцлохгүй'}</p>}{next.shortDesc!==undefined&&<p className="break-words">Товч тайлбар: {String(next.shortDesc)||'(хоосон)'}</p>}{next.duration!==undefined&&<p className="break-all">Эрхийн үнэ: {String(next.duration)}</p>}</td></tr>)}</tbody></table></div>
    <label><input type="checkbox" disabled={saving} checked={approved} onChange={e=>setApproved(e.target.checked)}/> Сонгосон {products.length} барааны өөрчлөлтийг шалгасан.</label>
    <div className="flex justify-end gap-2"><Button variant="outline" disabled={saving} onClick={onClose}>Болих</Button><Button disabled={saving||!!error||!approved||!Object.keys(patch).length} onClick={save}>{saving?'Хадгалж байна…':'Бүгдийг хадгалах'}</Button></div>
  </DialogContent></Dialog>
}
