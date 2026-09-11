'use client'

import { Zap, ShieldCheck, BadgeCheck, Headphones } from 'lucide-react'

const CARDS = [
  {
    Icon: Zap,
    title: 'Шуурхай хүргэлт',
    desc: 'Төлбөр баталгаажсны дараа 5-10 минутын дотор и-мэйл болон Telegram-аар шууд хүргэгдэнэ.',
    color: 'from-[#1677FF] to-[#0B4DBA]',
    bg: 'bg-[#E8F1FF]',
  },
  {
    Icon: ShieldCheck,
    title: 'Аюулгүй төлбөр',
    desc: 'Wire.mn системээр дамжуулан банкны картаар, Qpay кодоор аюулгүй төлбөрөө хийнэ.',
    color: 'from-[#16A34A] to-[#0B4DBA]',
    bg: 'bg-[#E6F7EB]',
  },
  {
    Icon: BadgeCheck,
    title: 'Баталгаатай бүтээгдэхүүн',
    desc: 'Бүх хэрэгсэл 7 хоногийн баталгаатай. Ажиллахгүй бол буцаалт эсвэл солилцоо хийгдэнэ.',
    color: 'from-[#8B5CF6] to-[#1677FF]',
    bg: 'bg-[#F0EAFF]',
  },
  {
    Icon: Headphones,
    title: '24/7 тусламж',
    desc: 'Хөдөлгөөнтэй чат болон Telegram хаяг дуусахгүй бэлэн. Асуудал гарвал шууд хандана уу.',
    color: 'from-[#F59E0B] to-[#DC2626]',
    bg: 'bg-[#FFF5E6]',
  },
]

export function WhyChooseUs() {
  return (
    <section className="relative py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D6E4FF] bg-white px-3 py-1 text-xs font-semibold text-[#1677FF]">
            <BadgeCheck className="size-3.5" /> Яагаад бид?
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#102A43]">
            Үйлчлүүлэгчид биднийг <span className="gradient-text">итгэдэг</span>
          </h2>
          <p className="mt-3 text-[#5B7290]">
            Чанар, хурд, аюулгүй байдал — төгс үйлчилгээний төлөө бид бэлэн
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {CARDS.map((c) => {
            const { Icon } = c
            return (
              <div
                key={c.title}
                className="group relative overflow-hidden rounded-2xl border border-[#D6E4FF] bg-white p-6 shadow-premium transition-all duration-300 hover:-translate-y-1 hover:shadow-premium-lg"
              >
                <div className={`absolute -right-8 -top-8 size-24 rounded-full ${c.bg} opacity-50 group-hover:opacity-80 transition-opacity`} />
                <div className="relative">
                  <div className={`grid size-12 place-items-center rounded-2xl bg-gradient-to-br ${c.color} shadow-premium`}>
                    <Icon className="size-6 text-white" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-[#102A43]">{c.title}</h3>
                  <p className="mt-2 text-sm text-[#5B7290] leading-relaxed">{c.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
