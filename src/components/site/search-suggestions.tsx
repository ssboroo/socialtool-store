'use client'

import { useEffect, useState } from 'react'
import { Search, ArrowUpRight } from 'lucide-react'
import { formatTugrik } from '@/lib/format'

type Suggestion = { id: string; name: string; price: number; category: string }
export function SearchSuggestions({ query, onSelect }: { query: string; onSelect: (id: string) => void }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    if (query.trim().length < 2) return
    const timer = window.setTimeout(() => {
      setLoading(true)
      void fetch('/api/search/suggest?q=' + encodeURIComponent(query.trim()), { signal: controller.signal })
        .then(async response => { if (!response.ok) throw Error('Хайлт амжилтгүй'); return response.json() })
        .then(data => { if (!controller.signal.aborted) setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []) })
        .catch(() => { if (!controller.signal.aborted) setSuggestions([]) })
        .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    }, 180)
    return () => { controller.abort(); window.clearTimeout(timer) }
  }, [query])
  if (query.trim().length < 2) return null
  return <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[100] min-w-[260px] overflow-hidden rounded-2xl border border-[#D6E4FF] bg-white p-2 shadow-[0_20px_55px_rgba(16,42,67,.2)]" role="listbox" aria-label="Хайлтын санал">
    <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#5B7290]">{loading ? 'Хайж байна…' : 'Тохирох бүтээгдэхүүн'}</div>
    {!loading && !suggestions.length ? <p className="px-3 py-3 text-xs text-[#5B7290]">Тохирох бараа олдсонгүй. Enter дарж бүрэн хайна уу.</p>
      : suggestions.map(item => <button key={item.id} type="button" role="option" aria-selected={false} onClick={() => onSelect(item.id)}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-[#E8F1FF] focus-visible:bg-[#E8F1FF] focus-visible:outline-none">
        <Search className="size-4 shrink-0 text-[#1677FF]" />
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[#102A43]">{item.name}</span><span className="block text-[11px] text-[#5B7290]">{item.category}</span></span>
        <span className="shrink-0 text-xs font-bold text-[#1677FF]">{item.price === 0 ? 'Үнэгүй' : formatTugrik(item.price)}</span>
        <ArrowUpRight className="size-3.5 shrink-0 text-[#5B7290]" />
      </button>)}
    <p className="border-t border-[#EEF4FF] px-3 pt-2 text-[11px] text-[#5B7290]">Монгол, англи нэр болон алдаатай бичсэн үгээр хайна.</p>
  </div>
}
