'use client'
import { useEffect, useState } from 'react'
export function HeroSlideshow({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hover, setHover] = useState(false)
  const active = index % images.length
  useEffect(() => {
    if (paused || hover || images.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = setInterval(() => setIndex(i => (i + 1) % images.length), 5000)
    return () => clearInterval(timer)
  }, [paused, hover, images.length])
  return <section aria-label="Нүүрний зургийн слайд" aria-roledescription="carousel" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setHover(true)} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setHover(false) }} className="mx-auto w-full max-w-xl overflow-hidden rounded-[2rem] border border-white bg-white p-3 shadow-xl">
    <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-blue-50">{images.map((src, i) => <img key={`${src}-${i}`} src={src} alt={`Socialtool постер ${i + 1}`} aria-hidden={i !== active} className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-700 motion-reduce:transition-none ${i === active ? 'opacity-100' : 'opacity-0'}`} loading={i === 0 ? 'eager' : 'lazy'} />)}</div>
    {images.length > 1 && <div className="flex flex-wrap items-center justify-center gap-2 pt-3"><button type="button" aria-label="Өмнөх зураг" onClick={() => setIndex(i => (i + images.length - 1) % images.length)} className="rounded-lg p-2 hover:bg-blue-50">←</button>{images.map((_, i) => <button key={i} type="button" aria-label={`${i + 1}-р зураг`} aria-current={i === active ? 'true' : undefined} onClick={() => setIndex(i)} className={`h-3 rounded-full ${i === active ? 'w-7 bg-blue-600' : 'w-3 bg-blue-200'}`} />)}<button type="button" aria-label="Дараах зураг" onClick={() => setIndex(i => (i + 1) % images.length)} className="rounded-lg p-2 hover:bg-blue-50">→</button><button type="button" onClick={() => setPaused(p => !p)} className="rounded-lg px-3 py-2 text-xs text-blue-700">{paused ? 'Тоглуулах' : 'Түр зогсоох'}</button></div>}
  </section>
}
