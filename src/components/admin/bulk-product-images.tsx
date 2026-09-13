'use client'
import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { suggestProductImage } from '@/lib/product-image-suggestions'
import { toast } from 'sonner'
type Item = {id:string;name:string;category:string;image:string|null}
export function BulkProductImages({ products, token, onClose, onSaved }: { products:Item[];token:string;onClose:()=>void;onSaved:()=>void }) {
  const [images,setImages] = useState<Record<string,string>>({})
  const [uploading,setUploading] = useState(0)
  const [saving,setSaving] = useState(false)
  const busy = uploading > 0 || saving
  const upload = async (file:File|undefined,id?:string) => {
    if (!file) return
    setUploading(n=>n+1)
    try {
      const form = new FormData(); form.append('file',file)
      const res = await fetch('/api/admin/products/upload',{method:'POST',headers:{authorization:`Bearer ${token}`},body:form})
      const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Зураг оруулж чадсангүй')
      setImages(current => id ? {...current,[id]:data.url} : Object.fromEntries(products.map(p=>[p.id,data.url])))
    } catch(e) { toast.error(e instanceof Error ? e.message : 'Зураг оруулахад алдаа гарлаа') }
    finally {setUploading(n=>n-1)}
  }
  const save = async () => {
    if (busy || products.some(p=>!images[p.id])) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/products/bulk-images',{method:'PUT',headers:{'Content-Type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify({items:products.map(p=>({id:p.id,previousImage:p.image,image:images[p.id]}))})})
      const data = await res.json();if(!res.ok) throw new Error(data.error || 'Хадгалж чадсангүй')
      toast.success(`${data.updated} бүтээгдэхүүний зураг шинэчлэгдлээ`);onSaved()
    } catch(e) {toast.error(e instanceof Error ? e.message : 'Хадгалж чадсангүй')}
    finally {setSaving(false)}
  }
  return <Dialog open onOpenChange={v=>{if(!v&&!busy)onClose()}}><DialogContent className="max-h-[90dvh] max-w-3xl overflow-y-auto"><DialogTitle>Зураг бөөнөөр солих · {products.length} бүтээгдэхүүн</DialogTitle><p className="text-sm text-slate-500">Бүх бараанд нэг зураг эсвэл нэр, ангилалд нь тохирох загвар сонгоно. Мөр бүрд тусдаа зураг оруулж болно. Доорх Хадгалах товч дарахад өөрчлөлт үйлчилнэ.</p>
    <div className="flex flex-wrap gap-3"><label className="rounded-lg border p-3 text-sm">Бүгдэд нэг зураг<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={busy} className="mt-2 block max-w-60 text-xs" onChange={e=>{void upload(e.target.files?.[0]);e.target.value=''}} /></label><Button type="button" variant="outline" disabled={busy} onClick={()=>setImages(Object.fromEntries(products.map(p=>[p.id,suggestProductImage(p.name,p.category)])))}>Бараа бүрд тохирох загвар санал болгох</Button></div>
    {uploading>0&&<p role="status">Зураг оруулж байна…</p>}
    <div className="space-y-3">{products.map(p=><div key={p.id} className="rounded-xl border p-3"><p className="mb-2 text-sm font-semibold">{p.name}</p><div className="flex flex-wrap items-center gap-3"><div className="text-center text-xs text-slate-500">{p.image?<img src={p.image} alt={`${p.name} одоогийн зураг`} className="size-20 rounded-lg object-contain"/>:<div className="grid size-20 place-items-center bg-slate-50">Зураггүй</div>}Одоогийн</div><span aria-hidden>→</span><div className="text-center text-xs text-blue-600">{images[p.id]?<img src={images[p.id]} alt={`${p.name} шинэ зураг`} className="size-20 rounded-lg object-contain"/>:<div className="grid size-20 place-items-center bg-blue-50">Сонгоогүй</div>}Шинэ</div><label className="min-w-0 text-xs">Тусдаа зураг<input type="file" aria-label={`${p.name} шинэ зураг оруулах`} accept="image/jpeg,image/png,image/webp,image/gif" disabled={busy} className="mt-2 block max-w-52" onChange={e=>{void upload(e.target.files?.[0],p.id);e.target.value=''}}/></label></div></div>)}</div>
    <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-white py-3"><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Болих</Button><Button type="button" disabled={busy||products.some(p=>!images[p.id])} onClick={()=>void save()}>{saving?'Хадгалж байна…':`${products.length} бүтээгдэхүүний зургийг хадгалах`}</Button></div>
  </DialogContent></Dialog>
}
