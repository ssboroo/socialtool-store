'use client'

import { useRef, useState } from 'react'
import { ProductDescription } from '@/components/site/product-description'

export function DescriptionEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const input = useRef<HTMLTextAreaElement>(null)
  const [preview, setPreview] = useState(false)
  function format(before: string, after = '', placeholder = 'Текст') {
    const el = input.current
    const start = el?.selectionStart ?? value.length
    const end = el?.selectionEnd ?? start
    const selection = value.slice(start, end) || placeholder
    onChange(value.slice(0, start) + before + selection + after + value.slice(end))
    setPreview(false)
    requestAnimationFrame(() => {
      input.current?.focus()
      input.current?.setSelectionRange(start + before.length, start + before.length + selection.length)
    })
  }
  return <div className="mt-2 overflow-hidden rounded-xl border border-[#D6E4FF]">
    <div role="toolbar" aria-label="Тайлбар форматлах" className="flex flex-wrap gap-1 border-b border-[#D6E4FF] bg-[#F5F9FF] p-2">
      {[
        { label: 'B · Тод', before: '**', after: '**' },
        { label: 'I · Налуу', before: '*', after: '*' },
        { label: 'Гарчиг', before: '\n\n## ', after: '\n\n' },
        { label: '• Жагсаалт', before: '\n- ', after: '\n' },
        { label: '1. Дугаарлах', before: '\n1. ', after: '\n' },
        { label: 'Холбоос', before: '[', after: '](https://example.com)' },
        { label: 'Ишлэл', before: '\n> ', after: '\n' },
        { label: '✓ Тэмдэг', before: '✓ ', after: '' },
      ].map(tool => <button key={tool.label} type="button" onMouseDown={e => e.preventDefault()} onClick={() => format(tool.before, tool.after)} className="rounded-md border border-transparent px-2.5 py-2 text-xs font-semibold text-[#102A43] hover:border-blue-200 hover:bg-white focus-visible:ring-2 focus-visible:ring-blue-500">{tool.label}</button>)}
      <button type="button" aria-pressed={preview} onClick={() => setPreview(!preview)} className="ml-auto rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white">{preview ? 'Засах' : 'Урьдчилж харах'}</button>
    </div>
    {preview ? <div className="max-h-[420px] min-h-64 overflow-y-auto p-5"><ProductDescription text={value} /></div> : <textarea ref={input} aria-label="Бүтээгдэхүүний бүрэн тайлбар" value={value} onChange={e => onChange(e.target.value)} onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && ['b', 'i'].includes(e.key.toLowerCase())) { e.preventDefault(); const mark = e.key.toLowerCase() === 'b' ? '**' : '*'; format(mark, mark) } }} rows={12} className="block min-h-64 w-full resize-y bg-white p-4 text-base leading-7 text-[#102A43] outline-none focus:ring-2 focus:ring-inset focus:ring-blue-300" placeholder="Бүтээгдэхүүний тайлбараа бичнэ үү…" />}
    <p className="border-t border-[#D6E4FF] px-3 py-2 text-xs text-[#5B7290]">Текстээ сонгоод формат дарна. Ctrl+B: тод, Ctrl+I: налуу. Урьдчилж харах нь сайтад харагдах загвартай ижил.</p>
  </div>
}
