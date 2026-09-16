'use client'
import { useEffect, useRef, useState } from 'react'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DescriptionEditor } from './description-editor'
import { ProductDescription } from '@/components/site/product-description'
import { ProductImage } from '@/components/site/product-illustration'
import { formatTugrik } from '@/lib/format'
import { licenseVariants } from '@/lib/license'
import { toast } from 'sonner'

export interface QuickProduct {
  id: string; name: string; shortDesc: string; description: string; price: number;
  oldPrice: number | null; categoryId: string; category: string; features: string | null;
  available: boolean; featured: boolean; image: string | null; icon: string;
  duration: string | null; updatedAt: string;
}
type Draft = Pick<QuickProduct, 'name'|'shortDesc'|'description'|'categoryId'|'available'|'featured'> & { price: string; oldPrice: string; features: string }
const toDraft = (p: QuickProduct): Draft => ({ name:p.name, shortDesc:p.shortDesc, description:p.description, categoryId:p.categoryId, available:p.available, featured:p.featured, price:String(p.price), oldPrice:p.oldPrice == null ? '' : String(p.oldPrice), features:p.features || '' })

export function QuickProductEditor({ product, categories, token, onClose, onSaved, onAdvanced }: {
  product: QuickProduct; categories: {id:string;name:string}[]; token:string;
  onClose:()=>void; onSaved:(p:QuickProduct)=>void; onAdvanced:()=>void;
}) {
  const [form,setForm]=useState<Draft>(()=>toDraft(product))
  const [baseline,setBaseline]=useState(()=>JSON.stringify(toDraft(product)))
  const [version,setVersion]=useState(product.updatedAt)
  const [savedDraft,setSavedDraft]=useState<{form:Draft;version:string}|null>(null)
  const [draftStatus,setDraftStatus]=useState('')
  const [saving,setSaving]=useState(false)
  const [aiBusy,setAiBusy]=useState(false)
  const [suggestion,setSuggestion]=useState<{field:'description'|'shortDesc'|'features';text:string}|null>(null)
  const [preview,setPreview]=useState(true)
  const saveLock=useRef(false)
  const formRef=useRef<HTMLFormElement>(null)
  const key=`socialtool-product-draft-v1:${product.id}`
  const dirty=JSON.stringify(form)!==baseline
  useEffect(()=>{
    try {
      const d=JSON.parse(localStorage.getItem(key)||'null')
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydrate browser-owned storage or imperative UI state after mount; SSR cannot read this source.
      if(d?.form && typeof d.version==='string' && Date.now()-d.time<30*86400000 && Object.keys(toDraft(product)).every(k=>typeof d.form[k]===typeof toDraft(product)[k as keyof Draft])) setSavedDraft(d)
    } catch { setDraftStatus('Ноорог унших боломжгүй байна.') }
  // This editor is keyed by product id, never reset in-progress edits on list refresh.
  },[key])
  useEffect(()=>{
    if(!dirty || savedDraft) return
    const persist=()=>{try {localStorage.setItem(key,JSON.stringify({form,version,time:Date.now()}));setDraftStatus('Ноорог энэ төхөөрөмжид хадгалагдсан')} catch {setDraftStatus('Ноорог хадгалах зай хүрэхгүй байна. Хадгалах товч дарна уу.')}}
    const timer=setTimeout(persist,400)
    const unload=(e:BeforeUnloadEvent)=>{persist();e.preventDefault();e.returnValue=''}
    window.addEventListener('beforeunload',unload)
    window.addEventListener('pagehide',persist)
    return ()=>{clearTimeout(timer);window.removeEventListener('beforeunload',unload);window.removeEventListener('pagehide',persist);persist()}
  },[dirty,form,key,version,savedDraft])
  useEffect(()=>{
    const handle=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();formRef.current?.requestSubmit()}}
    window.addEventListener('keydown',handle);return ()=>window.removeEventListener('keydown',handle)
  },[])
  const close=()=>{if(saving||aiBusy)return;if(dirty&&!confirm('Өөрчлөлт серверт хадгалагдаагүй. Ноорог үлдээгээд хаах уу?'))return;onClose()}
  const save=async(e:React.FormEvent)=>{
    e.preventDefault();if(saveLock.current||aiBusy||savedDraft)return
    if(!Number.isSafeInteger(Number(form.price))||Number(form.price)<=0){toast.error('Үнэ эерэг бүхэл тоо байна');return}
    const cat=categories.find(c=>c.id===form.categoryId);if(!cat)return
    saveLock.current=true;setSaving(true)
    try {
      const r=await fetch(`/api/admin/products/${product.id}`,{method:'PUT',headers:{'Content-Type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify({...form,price:Number(form.price),oldPrice:form.oldPrice?Number(form.oldPrice):null,category:cat.name,expectedUpdatedAt:version})})
      const p=await r.json();if(!r.ok)throw new Error(p.error||'Хадгалж чадсангүй')
      setBaseline(JSON.stringify(form));setVersion(p.updatedAt);setDraftStatus('Серверт хадгалсан');onSaved(p);toast.success('Хадгаллаа. Үргэлжлүүлэн засаж болно.')
      // Cleanup after the previous dirty effect has persisted its last snapshot.
      setTimeout(()=>{try{localStorage.removeItem(key)}catch{}},0)
    } catch(e){toast.error(e instanceof Error?e.message:'Хадгалах үед алдаа гарлаа')} finally {saveLock.current=false;setSaving(false)}
  }
  const assist=async(action:string)=>{
    setAiBusy(true);setSuggestion(null)
    try {
      const r=await fetch('/api/admin/products/assist',{method:'POST',headers:{'Content-Type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify({action,name:form.name,description:form.description,shortDesc:form.shortDesc,features:form.features})})
      const d=await r.json();if(!r.ok)throw new Error(d.error||'AI хүсэлт бүтэлгүйтлээ')
      setSuggestion({field:action==='shorten'?'shortDesc':action==='features'?'features':'description',text:d.text})
    }catch(e){toast.error(e instanceof Error?e.message:'AI алдаа')}finally{setAiBusy(false)}
  }
  return <Sheet open onOpenChange={o=>{if(!o)close()}}><SheetContent className="w-full sm:max-w-6xl gap-0 overflow-hidden" aria-describedby="quick-editor-help">
    <div className="border-b p-5 pr-12"><SheetTitle>Шуурхай засах</SheetTitle><SheetDescription id="quick-editor-help">Өөрчлөлтөө хадгалаад үргэлжлүүлэн засна. Ctrl+S / ⌘S</SheetDescription></div>
    <form ref={formRef} onSubmit={save} className="flex min-h-0 min-w-0 flex-1 flex-col [&_button]:max-w-full [&_button]:whitespace-normal [&_button]:h-auto [&_button]:min-h-9 [&_label]:min-w-0 [&_label]:break-words [&_input]:min-w-0">
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {savedDraft&&<div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-slate-900"><p>Хадгалаагүй ноорог байна.{savedDraft.version!==version?' Серверийн мэдээлэл өөрчлөгдсөн тул нооргоо сэргээсний дараа хуучин хувилбар гэж анхааруулна.':''}</p><Button type="button" onClick={()=>{setForm(savedDraft.form);setVersion(savedDraft.version);setSavedDraft(null)}}>Ноорог сэргээх</Button><Button type="button" variant="ghost" onClick={()=>{try{localStorage.removeItem(key)}catch{};setSavedDraft(null)}}>Ноорог устгах</Button></div>}
        <div className={preview?'grid gap-6 lg:grid-cols-2':'grid gap-6'}>
          <fieldset disabled={saving||aiBusy||!!savedDraft} className="min-w-0 space-y-4">
            <label className="block text-sm font-medium">Нэр<Input required maxLength={160} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><label className="text-sm">Үндсэн үнэ (₮)<Input required type="number" min="1" step="1" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></label><label className="text-sm">Хуучин үнэ (заавал биш)<Input type="number" min="1" step="1" value={form.oldPrice} onChange={e=>setForm({...form,oldPrice:e.target.value})}/></label></div>
            {licenseVariants(product.duration).length>0&&<p className="text-xs text-amber-700">Эрхийн хувилбарын үнэ тусдаа. Доорх «Нэмэлт тохиргоо»-ноос засна.</p>}
            <label className="block text-sm">Ангилал<select className="mt-1 w-full rounded-md border bg-background p-2" value={form.categoryId} onChange={e=>setForm({...form,categoryId:e.target.value})}>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label className="block text-sm">Товч тайлбар<textarea maxLength={500} className="mt-1 min-h-20 w-full rounded-md border bg-background p-3" value={form.shortDesc} onChange={e=>setForm({...form,shortDesc:e.target.value})}/></label>
            <div className="flex flex-wrap gap-2">{[['translate','Монголчил'],['shorten','Товчил'],['polish','Найруулгыг сайжруул'],['features','Онцлог үүсгэ']].map(([a,t])=><Button key={a} type="button" variant="outline" disabled={aiBusy||!form.description.trim()} onClick={()=>assist(a)}>AI · {t}</Button>)}</div>
            <p className="text-xs text-muted-foreground">AI нь нэр, тайлбар, онцлогийг OpenAI руу илгээнэ. Үр дүнг шалгаж «Ашиглах» дарсны дараа ноорогт орно.</p>
            <div><p className="text-sm font-medium">Дэлгэрэнгүй тайлбар</p><DescriptionEditor value={form.description} onChange={description=>setForm(f=>({...f,description}))}/></div>
            <label className="block text-sm">Онцлог («;»-аар тусгаарлана)<textarea maxLength={5000} className="mt-1 min-h-24 w-full rounded-md border bg-background p-3" value={form.features} onChange={e=>setForm({...form,features:e.target.value})}/></label>
            <div className="flex gap-5"><label><input type="checkbox" checked={form.available} onChange={e=>setForm({...form,available:e.target.checked})}/> Бэлэн</label><label><input type="checkbox" checked={form.featured} onChange={e=>setForm({...form,featured:e.target.checked})}/> Онцлох</label></div>
            <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={async()=>{try{await navigator.clipboard.writeText(form.description);toast.success('Тайлбар хууллаа')}catch{toast.error('Хуулах боломжгүй')}}}>Тайлбар хуулах</Button><Button type="button" variant="outline" onClick={()=>{if(dirty){toast.error('Эхлээд өөрчлөлтөө хадгална уу.');return}onAdvanced()}}>Нэмэлт тохиргоо</Button></div>
            <p className="text-xs text-muted-foreground">Зураг, хугацааны үнэ, видео, зааврын зургуудыг нэмэлт тохиргооноос засна.</p>
          </fieldset>
          {preview&&<aside className="min-w-0 rounded-2xl border bg-background p-5"><p className="mb-3 text-xs font-semibold text-muted-foreground">ХАДГАЛААГҮЙ ӨӨРЧЛӨЛТИЙН УРЬДЧИЛСАН ХАРАГДАЦ</p><ProductImage image={product.image} icon={product.icon} alt={form.name} className="h-48 w-full"/><h3 className="mt-4 text-2xl font-bold break-words">{form.name}</h3><p className="my-2 text-muted-foreground break-words">{form.shortDesc}</p><p className="text-xl font-bold text-blue-600">{formatTugrik(Number(form.price)||0)}</p><div className="my-3 flex flex-wrap gap-2">{licenseVariants(product.duration).map(v=><span className="rounded-lg border p-2 text-sm" key={v.term}>{v.term} · {formatTugrik(v.price??Number(form.price))}</span>)}</div><p className="mb-4 text-sm">{form.available?'Бэлэн':'Дууссан'}{form.featured?' · Онцлох':''}</p><ul className="mb-5 list-disc pl-5">{form.features.split(';').filter(Boolean).map((f,i)=><li className="break-words" key={i}>{f}</li>)}</ul><ProductDescription text={form.description}/></aside>}
        </div>
        {aiBusy&&<p role="status" className="my-4">AI тайлбар бэлдэж байна…</p>}
        {suggestion&&<div className="mt-4 space-y-3 rounded-xl border border-blue-300 p-4"><p className="font-semibold">AI санал — баримт, нөхцөлийг шалгаарай</p><textarea aria-label="AI санал" className="min-h-48 w-full rounded border bg-background p-3" value={suggestion.text} onChange={e=>setSuggestion({...suggestion,text:e.target.value})}/><Button type="button" onClick={()=>{setForm(f=>({...f,[suggestion.field]:suggestion.text}));setSuggestion(null)}}>Ноорогт ашиглах</Button><Button type="button" variant="ghost" onClick={()=>setSuggestion(null)}>Болих</Button></div>}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t bg-background p-4"><span role="status" className="w-full break-words text-xs text-muted-foreground">{draftStatus||'Өөрчлөлт оруулаарай'}</span><Button type="button" variant="ghost" onClick={()=>setPreview(v=>!v)}>{preview?'Урьдчилсан харагдацыг нуух':'Урьдчилж харах'}</Button><Button type="button" variant="outline" disabled={saving||aiBusy} onClick={close}>Хаах</Button><Button type="submit" disabled={saving||aiBusy||!dirty||!!savedDraft}>{saving?'Хадгалж байна…':'Хадгалах · Ctrl+S'}</Button></div>
    </form>
  </SheetContent></Sheet>
}
