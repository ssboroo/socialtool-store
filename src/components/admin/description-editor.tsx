'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
const VisualEditor = dynamic(() => import('./visual-description-editor'), { ssr: false, loading: () => <p className="p-4">Засварлагч ачаалж байна…</p> })
export function DescriptionEditor(props: { value: string; onChange: (value: string) => void }) {
  const [source, setSource] = useState(false)
  return <div className="mt-2 rounded-xl border border-blue-100 bg-white"><div className="flex justify-end border-b p-2"><button type="button" className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700" onClick={() => setSource(v => !v)}>{source ? "Форматтай засах" : "Markdown текст засах"}</button></div>{source ? <textarea aria-label="Тайлбарын Markdown текст" className="min-h-64 w-full p-4 text-base leading-7" value={props.value} onChange={e => props.onChange(e.target.value)} /> : <VisualEditor {...props} />}<p className="border-t p-3 text-xs text-slate-500">Текстээ сонгоод B товч эсвэл Ctrl+B дарж тодруулна. Өөрчлөлтөө бүтээгдэхүүний Хадгалах товчоор хадгална.</p></div>
}
