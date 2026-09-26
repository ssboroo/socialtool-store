'use client'

import { useEffect, useState } from 'react'
import { productShareText, productShareUrl, publicProductImage } from '@/lib/product-share'

type Product = { id: string; name: string; shortDesc: string; price: number; duration?: string | null; image?: string | null; available: boolean }
const control = 'w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white'
const button = 'inline-flex min-h-11 items-center justify-center rounded-xl border px-4 py-3 text-center text-sm font-semibold'

export function FacebookShare() {
  const [products, setProducts] = useState<Product[]>([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Product | null>(null)
  const [draft, setDraft] = useState('')
  const [origin, setOrigin] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [reload, setReload] = useState(0)
  useEffect(() => {
    setOrigin(window.location.origin)
    const controller = new AbortController()
    setLoading(true); setError(''); setSelected(null); setDraft('')
    fetch('/api/admin/products', { cache: 'no-store', signal: controller.signal })
      .then(async r => { if (!r.ok) throw new Error('Бүтээгдэхүүн уншиж чадсангүй. Нэвтрэлтээ шалгаарай.'); return r.json() })
      .then(data => { if (!Array.isArray(data)) throw new Error('Бүтээгдэхүүний мэдээлэл буруу байна.'); setProducts(data) })
      .catch(e => { if (!controller.signal.aborted) setError(e.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [reload])
  function choose(p: Product) { setSelected(p); setDraft(productShareText(p, origin)); setNotice('') }
  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); setNotice('Хууллаа. Facebook дээрээ буулгана уу.') }
    catch { setNotice('Автоматаар хуулж чадсангүй. Доорх текстийг сонгоод гараар хуулна уу.') }
  }
  const visible = products.filter(p => p.available && p.name.toLowerCase().includes(query.toLowerCase()))
  const url = selected && origin ? productShareUrl(selected.id, origin) : ''
  const image = selected ? publicProductImage(selected.image, origin) : null
  return <section className="space-y-5">
    <h2 className="text-2xl font-bold">Facebook Page дээр хуваалцах</h2>
    <p>Бараагаа сонгоод постын текстээ засаж хуулна. Meta Business Suite нээгээд өөрийн Page-ийг сонгон текстээ буулгаж нийтлээрэй.</p>
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="min-w-0 space-y-3">
        <label className="block">Бүтээгдэхүүн хайх<input className={control} value={query} onChange={e => setQuery(e.target.value)} /></label>
        <button type="button" className={button} disabled={loading} onClick={() => setReload(v => v + 1)}>Жагсаалт шинэчлэх</button>
        {loading ? <p role="status">Уншиж байна…</p> : error ? <p role="alert">{error}</p> :
        <div className="max-h-[32rem] overflow-auto rounded-xl border">
          {visible.length ? visible.map(p => <button type="button" key={p.id} aria-pressed={selected?.id === p.id} onClick={() => choose(p)} className={'block w-full break-words border-b p-4 text-left ' + (selected?.id === p.id ? 'bg-blue-100 text-blue-950' : '')}>{p.name}</button>) : <p className="p-4">Бэлэн бүтээгдэхүүн олдсонгүй.</p>}
        </div>}
      </div>
      <div className="min-w-0 space-y-4 rounded-2xl border p-4 sm:p-6">
        <h3 className="font-bold">Пост бэлтгэх</h3>
        {selected ? <>
          {image && <a href={image} target="_blank" rel="noopener noreferrer" className="block text-blue-600 underline">Бүтээгдэхүүний зураг нээх / хадгалах ↗</a>}
          <label className="block">Постын текст<textarea rows={12} className={control + ' mt-2 resize-y'} value={draft} onChange={e => setDraft(e.target.value)} /></label>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={button + ' bg-blue-600 text-white'} onClick={() => copy(draft)}>Текст хуулах</button>
            <a href="https://business.facebook.com/" target="_blank" rel="noopener noreferrer" className={button}>Page дээр нийтлэх ↗</a>
            <a href={'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url)} target="_blank" rel="noopener noreferrer" className={button}>Холбоос хуваалцах ↗</a>
          </div>
          <label className="block">Бүтээгдэхүүний холбоос<input readOnly className={control + ' mt-2'} value={url} onFocus={e => e.target.select()} /></label>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={button} onClick={() => copy(url)}>Холбоос хуулах</button>
            <a href={url} target="_blank" rel="noopener noreferrer" className={button}>Урьдчилан харах ↗</a>
          </div>
          <p className="text-sm">Энд текст засахад бүтээгдэхүүний мэдээлэл өөрчлөгдөхгүй. Facebook цонх нээх нь нийтэлсэн гэсэн үг биш — Page болон постоо шалгаад Facebook дээр “Нийтлэх” дарна уу.</p>
        </> : <p>Зүүн талаас бүтээгдэхүүнээ сонгоно уу.</p>}
        <p role="status" className="break-words">{notice}</p>
      </div>
    </div>
  </section>
}
