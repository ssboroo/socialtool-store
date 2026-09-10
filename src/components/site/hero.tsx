'use client'

import { Bot, Facebook, Headphones, Instagram, Music2, Send, ShieldCheck, Sparkles, TrendingUp, Youtube, Zap } from 'lucide-react'

export function Hero({ settings }: { settings?: Record<string, string> }) {
  const subtext = settings?.heroSubtext || 'SMM, автоматжуулалт, AI болон бүтээмжийн хэрэгслүүдийг найдвартай, хурдан, хялбар.'

  const trustItems = [
    { Icon: ShieldCheck, title: '100% Найдвартай', text: 'Баталгаат үйлчилгээ' },
    { Icon: Zap, title: 'Шуурхай хүргэлт', text: 'Автоматаар илгээх' },
    { Icon: Headphones, title: '24/7 Дэмжлэг', text: 'Асуудал гарвал тусална' },
  ]

  return (
    <section id="top" className="px-4 pt-5 sm:px-6 lg:px-8 lg:pt-6">
      <div className="relative mx-auto max-w-[1440px] overflow-hidden rounded-[28px] border border-white/80 bg-[linear-gradient(115deg,#F5FAFF_0%,#EAF4FF_43%,#CFE4FF_72%,#9EC9FF_100%)] shadow-[0_22px_70px_rgba(31,103,190,.13)]">
        <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,.95),transparent_28%),radial-gradient(circle_at_76%_18%,rgba(255,255,255,.55),transparent_24%),linear-gradient(rgba(255,255,255,.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.22)_1px,transparent_1px)] [background-size:auto,auto,34px_34px,34px_34px]" />
        <div className="absolute -right-24 -top-28 size-[420px] rounded-full bg-[#5CA6FF]/25 blur-3xl" />
        <div className="absolute bottom-0 left-[42%] h-40 w-72 rounded-full bg-white/35 blur-3xl" />

        <div className="relative grid min-h-[330px] items-center gap-8 px-6 py-8 sm:px-9 lg:grid-cols-[1.02fr_.98fr] lg:px-12 lg:py-10 xl:px-14">
          <div className="max-w-[650px]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-3 py-1.5 text-[11px] font-extrabold tracking-[0.04em] text-[#1768D7] shadow-sm ring-1 ring-[#BFD8FA]">
              <Sparkles className="size-3.5" /> ДИЖИТАЛ ӨСӨЛТИЙН ХЭРЭГСЛҮҮД
            </span>

            <h1 className="mt-4 max-w-[620px] text-[38px] font-black leading-[1.04] tracking-[-0.045em] text-[#102A43] sm:text-[48px] lg:text-[54px]">
              Дижитал өсөлтийн<br />бүх хэрэгсэл нэг дор
            </h1>

            <p className="mt-4 max-w-[620px] text-[15px] font-medium leading-7 text-[#58718F] sm:text-base">
              {subtext}
            </p>

            <div className="mt-7 grid max-w-[640px] gap-3 sm:grid-cols-3">
              {trustItems.map(({ Icon, title, text }) => (
                <div key={title} className="flex items-center gap-3 rounded-2xl bg-white/56 p-2.5 ring-1 ring-white/80 backdrop-blur-sm">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-[#1677FF] shadow-[0_6px_18px_rgba(22,119,255,.13)] ring-1 ring-[#D6E7FF]">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12px] font-extrabold text-[#183A60]">{title}</span>
                    <span className="mt-0.5 block text-[10px] font-medium leading-4 text-[#7187A2]">{text}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden h-[270px] lg:block">
            <div className="absolute left-[6%] top-[20%] h-[170px] w-[65%] -rotate-3 rounded-[34px] border border-white/60 bg-white/18 shadow-[0_28px_60px_rgba(42,105,188,.18)] backdrop-blur-md" />
            <div className="absolute right-[5%] top-[8%] h-[205px] w-[68%] rotate-3 rounded-[36px] border border-white/75 bg-white/23 shadow-[0_28px_60px_rgba(42,105,188,.2)] backdrop-blur-md" />

            <div className="absolute left-[9%] top-[28%] grid size-[76px] place-items-center rounded-[22px] bg-gradient-to-br from-[#258BFF] to-[#0866D9] text-white shadow-[0_18px_32px_rgba(24,103,221,.34)] ring-1 ring-white/65">
              <Facebook className="size-10 fill-white" />
            </div>
            <div className="absolute left-[30%] top-[8%] grid size-[76px] place-items-center rounded-[22px] bg-gradient-to-br from-[#FFB34C] via-[#F65391] to-[#7655F5] text-white shadow-[0_18px_32px_rgba(236,82,150,.28)] ring-1 ring-white/65">
              <Instagram className="size-10" />
            </div>
            <div className="absolute left-[51%] top-[34%] grid size-[78px] place-items-center rounded-[22px] bg-white text-[#1B8FD1] shadow-[0_18px_32px_rgba(24,103,221,.2)] ring-1 ring-white/75">
              <Bot className="size-10" />
            </div>
            <div className="absolute left-[42%] bottom-[2%] grid size-[70px] place-items-center rounded-[20px] bg-[#0C1320] text-white shadow-[0_18px_32px_rgba(11,25,48,.3)] ring-1 ring-white/50">
              <Music2 className="size-9" />
            </div>
            <div className="absolute left-[20%] bottom-[1%] grid size-[60px] place-items-center rounded-[18px] bg-white text-[#FF2E2E] shadow-[0_16px_28px_rgba(24,103,221,.16)] ring-1 ring-white/75">
              <Youtube className="size-8 fill-[#FF2E2E]" />
            </div>
            <div className="absolute right-[13%] bottom-[8%] grid size-[62px] place-items-center rounded-[18px] bg-gradient-to-br from-[#34C8FF] to-[#1598DF] text-white shadow-[0_16px_28px_rgba(22,119,255,.24)] ring-1 ring-white/70">
              <Send className="size-8 fill-white/20" />
            </div>

            <div className="absolute right-[3%] top-[18%] w-[180px] rounded-[24px] border border-white/75 bg-white/32 p-5 shadow-[0_20px_45px_rgba(33,91,166,.18)] backdrop-blur-lg">
              <TrendingUp className="size-7 text-white" />
              <p className="mt-5 text-[17px] font-extrabold leading-6 text-white drop-shadow-sm">Илүү бүтээмж<br />Илүү боломж<br />Илүү амжилт</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
