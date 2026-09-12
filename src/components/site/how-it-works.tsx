'use client'

import { MousePointerClick, CreditCard, PackageCheck } from 'lucide-react'

const STEPS = [
  {
    Icon: MousePointerClick,
    title: 'Хэрэгслээ сонгоно',
    desc: 'Хэрэгслээ сонгоод хугацаа, тоо ширхгээ тохируулж сагсанд нэмнэ.',
    color: 'from-[#1677FF] to-[#0B4DBA]',
  },
  {
    Icon: CreditCard,
    title: 'Төлбөрөө хийнэ',
    desc: 'Захиалгын мэдээллээ оруулаад QPay-аар төлбөрөө төлнө.',
    color: 'from-[#0B4DBA] to-[#8B5CF6]',
  },
  {
    Icon: PackageCheck,
    title: 'Захиалгаа хүлээн авна',
    desc: 'Төлбөр баталгаажсаны дараа бүтээгдэхүүний нөхцөлийн дагуу хандалт эсвэл идэвхжүүлэлтийн заавраа авна.',
    color: 'from-[#16A34A] to-[#1677FF]',
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="relative py-16 lg:py-20 bg-gradient-to-b from-[#EEF4FF]/40 to-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D6E4FF] bg-white px-3 py-1 text-xs font-semibold text-[#1677FF]">
            Хэрхэн захиалах вэ?
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#102A43]">
            Зөвхөн <span className="gradient-text">3 алхам</span>
          </h2>
          <p className="mt-3 text-[#5B7290]">Хэрэгслээ сонгоод дараах гурван алхмыг дагаарай.</p>
        </div>

        <div className="mt-12 relative">
          {/* connector line */}
          <div className="hidden lg:block absolute top-[44px] left-[16.66%] right-[16.66%] h-0.5 bg-gradient-to-r from-[#1677FF]/20 via-[#1677FF]/40 to-[#1677FF]/20" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {STEPS.map((s, i) => {
              const { Icon } = s
              return (
                <div key={s.title} className="relative flex flex-col items-center text-center">
                  <div className="relative">
                    <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-[#1677FF]/20 to-transparent blur-md" />
                    <div className={`relative grid size-[88px] place-items-center rounded-full bg-gradient-to-br ${s.color} shadow-premium-lg`}>
                      <Icon className="size-9 text-white" />
                      <span className="absolute -right-1 -top-1 grid size-7 place-items-center rounded-full bg-white border border-[#D6E4FF] text-xs font-bold text-[#102A43] shadow-premium">
                        {i + 1}
                      </span>
                    </div>
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-[#102A43]">{s.title}</h3>
                  <p className="mt-2 text-sm text-[#5B7290] max-w-xs leading-relaxed">{s.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
