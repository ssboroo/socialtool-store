'use client'

import { Star, Quote } from 'lucide-react'

export interface Review {
  id: string
  name: string
  role: string
  rating: number
  content: string
}

function Avatar({ name }: { name: string }) {
  const initials = name.slice(0, 2).toUpperCase()
  const colors = [
    'from-[#1677FF] to-[#0B4DBA]',
    'from-[#8B5CF6] to-[#1677FF]',
    'from-[#16A34A] to-[#0B4DBA]',
    'from-[#F59E0B] to-[#DC2626]',
    'from-[#E1306C] to-[#F77737]',
    'from-[#0B4DBA] to-[#8B5CF6]',
  ]
  const idx = name.charCodeAt(0) % colors.length
  return (
    <div className={`grid size-11 place-items-center rounded-full bg-gradient-to-br ${colors[idx]} text-white font-bold shadow-premium`}>
      {initials}
    </div>
  )
}

export function Reviews({ reviews }: { reviews: Review[] }) {
  return (
    <section id="reviews" className="store-section store-reviews">
      <div className="store-container store-section-inner">
        <div className="store-section-heading">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D6E4FF] bg-white px-3 py-1 text-xs font-semibold text-[#1677FF]">
            <Star className="size-3.5 fill-[#1677FF] text-[#1677FF]" /> Үйлчлүүлэгчийн сэтгэгдэл
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#102A43]">
            Хэрэглэгчдийн <span className="gradient-text">үнэлгээ</span>
          </h2>
          <p className="mt-3 text-[#5B7290]">Хэрэглэгчдийн хуваалцсан туршлага</p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {reviews.length === 0 && <p className="store-empty-review">Одоогоор сэтгэгдэл нийтлэгдээгүй байна.</p>}
          {reviews.map((r) => (
            <div
              key={r.id}
              className="store-glass-card group relative rounded-2xl border border-[#D6E4FF] bg-white p-6 shadow-premium transition-all duration-300 hover:-translate-y-1 hover:shadow-premium-lg"
            >
              <Quote className="absolute right-5 top-5 size-8 text-[#1677FF]/10 group-hover:text-[#1677FF]/20 transition-colors" />
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`size-4 ${i < r.rating ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-[#D6E4FF] fill-[#D6E4FF]'}`}
                  />
                ))}
              </div>
              <p className="mt-3 text-sm text-[#5B7290] leading-relaxed">“{r.content}”</p>
              <div className="mt-5 flex items-center gap-3 border-t border-[#EEF4FF] pt-4">
                <Avatar name={r.name} />
                <div>
                  <div className="text-sm font-bold text-[#102A43]">{r.name}</div>
                  <div className="text-xs text-[#5B7290]">{r.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
