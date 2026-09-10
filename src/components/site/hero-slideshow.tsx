'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react'

export function HeroSlideshow({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hover, setHover] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(true)
  const active = images.length ? index % images.length : 0

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(preference.matches)
    update()
    preference.addEventListener('change', update)
    return () => preference.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (paused || hover || reducedMotion || images.length < 2) return
    const timer = setTimeout(() => setIndex(i => (i + 1) % images.length), 5000)
    return () => clearTimeout(timer)
  }, [index, paused, hover, reducedMotion, images.length])

  if (!images.length) return null
  const move = (delta: number) => setIndex(i => (i + delta + images.length) % images.length)

  return (
    <section aria-label="Нүүрний зургийн слайд" aria-roledescription="carousel"
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setHover(false) }}
      onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); move(e.key === 'ArrowLeft' ? -1 : 1) } }}
      className="hero-banner relative mx-auto w-full max-w-[520px] overflow-hidden rounded-3xl border border-blue-200/70 bg-white p-2 shadow-[0_24px_60px_-24px_#1677ff60] sm:p-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#EEF4FF]">
        {/* Only one slide is mounted: text never cross-fades over another poster. */}
        <img key={`${images[active]}-${active}`} src={images[active]} alt={`Socialtool постер ${active + 1}`}
          className="hero-slide h-full w-full object-contain" loading="eager" decoding="async" />
        {images.length > 1 && <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-blue-900 shadow-sm">{active + 1} / {images.length}</span>}
      </div>
      {images.length > 1 && <div className="flex items-center justify-between gap-2 px-1 pt-2">
        <button type="button" aria-label="Өмнөх зураг" onClick={() => move(-1)} className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100"><ArrowLeft className="size-4" /></button>
        <div className="flex flex-wrap justify-center gap-1">{images.map((_, i) => <button key={i} type="button" aria-label={`${i + 1}-р зураг`} aria-current={i === active ? 'true' : undefined} onClick={() => setIndex(i)} className="grid h-10 min-w-6 place-items-center"><span className={`h-1.5 rounded-full transition-all ${i === active ? 'w-6 bg-blue-600' : 'w-1.5 bg-blue-200'}`} /></button>)}</div>
        <div className="flex shrink-0 gap-1">
          <button type="button" aria-label={paused ? 'Тоглуулах' : 'Түр зогсоох'} aria-pressed={paused} onClick={() => setPaused(p => !p)} className="grid size-10 place-items-center rounded-xl text-blue-700 hover:bg-blue-50">{paused ? <Play className="size-4" /> : <Pause className="size-4" />}</button>
          <button type="button" aria-label="Дараах зураг" onClick={() => move(1)} className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100"><ArrowRight className="size-4" /></button>
        </div>
      </div>}
    </section>
  )
}
