'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ProductDescription } from '@/components/site/product-description'
const VisualEditor = dynamic(() => import('./visual-description-editor'), { ssr:false, loading:()=><p className="p-4" role="status">Засварлагч ачаалж байна…</p> })

export function DescriptionEditor({value,onChange}:{value:string;onChange:(value:string)=>void}) {
  const [mode,setMode]=useState<'visual'|'text'|'preview'>('visual')
  const [large,setLarge]=useState(false)
  const [error,setError]=useState(false)
  return <div className="description-editor mt-2 min-w-0 overflow-hidden rounded-xl border border-blue-100 bg-background">
    <div className="flex flex-wrap items-center gap-2 border-b p-2" role="group" aria-label="Тайлбар засах горим">
      {([['visual','Форматтай засах'],['text','Текстээр засах'],['preview','Урьдчилж харах']] as const).map(([id,label])=><button key={id} type="button" aria-pressed={mode===id} className={`min-h-10 rounded-lg px-3 py-2 text-sm font-medium ${mode===id?'bg-blue-600 text-white':'bg-blue-50 text-blue-800'}`} onClick={()=>{setError(false);setMode(id)}}>{label}</button>)}
      <button type="button" aria-pressed={large} className="ml-auto min-h-10 rounded-lg border px-3 text-sm" onClick={()=>setLarge(v=>!v)}>{large?'Талбайг багасгах':'Талбайг томруулах'}</button>
    </div>
    {error&&<p role="alert" className="border-b bg-amber-50 p-3 text-sm text-amber-900">Энэ тайлбарын зарим формат засварлагчид дэмжигдэхгүй байна. Эх текст хэвээр байгаа тул текстээр засах горимд орууллаа.</p>}
    {mode==='text'?<textarea aria-label="Дэлгэрэнгүй тайлбарын Markdown текст" spellCheck={false} className={`block w-full resize-y bg-background p-4 font-mono text-base leading-7 outline-offset-[-2px] ${large?'min-h-[60vh]':'min-h-80'}`} value={value} onChange={e=>onChange(e.target.value)}/>:mode==='preview'?<div className={`overflow-y-auto p-5 ${large?'min-h-[60vh] max-h-[70vh]':'min-h-80 max-h-[480px]'}`}><ProductDescription text={value}/></div>:<VisualEditor value={value} onChange={onChange} large={large} onError={()=>{setError(true);setMode('text')}}/>}
    <div className="space-y-1 border-t px-4 py-3 text-sm text-muted-foreground"><p><strong>B</strong> — тод · <em>I</em> — налуу · Гарчиг — хэмжээ · Жагсаалт — цэгтэй / дугаартай</p><p>Текстээ сонгоод форматлана. Энгийн текст 16px; гарчиг 24 / 20 / 18px. Ctrl+B / ⌘B — тодруулах.</p><p className="text-xs">Өөрчлөлтөө бүтээгдэхүүний «Хадгалах» товчоор хадгална. «Урьдчилж харах» нь сайт дээр ашигладаг текстийн загварыг харуулна.</p></div>
  </div>
}
