'use client'

import {
  ArrowRight,
  Bot,
  Check,
  Facebook,
  Headphones,
  Instagram,
  Music2,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  Youtube,
  Zap,
} from 'lucide-react'

function scrollTo(selector: string) {
  document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function Hero({ settings }: { settings?: Record<string, string> }) {
  const subtext = settings?.heroSubtext || 'SMM, автоматжуулалт, AI болон бүтээмжийн хэрэгслүүдийг найдвартай, хурдан, хялбар.'

  return (
    <section id="top" className="px-4 pt-4 sm:px-6 lg:px-8 lg:pt-5">
      <div className="relative mx-auto max-w-[1440px] overflow-hidden rounded-[18px] border border-[#E2ECF8] bg-[linear-gradient(105deg,#F8FBFF_0%,#EDF6FF_42%,#DCEEFF_73%,#C4E0FF_100%)] shadow-[0_12px_38px_rgba(31,103,190,.10)]">
        <div className="pointer-events-none absolute inset-0 opacity-65 [background-image:radial-gradient(circle_at_16%_18%,rgba(255,255,255,.96),transparent_27%),radial-gradient(circle_at_69%_15%,rgba(255,255,255,.62),transparent_23%)]" />
        <div className="pointer-events-none absolute left-[38%] top-1/2 h-56 w-96 -translate-y-1/2 rounded-full bg-white/35 blur-3xl" />

        <div className="relative grid min-h-[318px] gap-5 px-5 py-7 sm:px-7 lg:grid-cols-[.92fr_1.08fr] lg:px-9 xl:px-10">
          <div className="flex flex-col justify-center">
            <h1 className="max-w-[620px] text-[38px] font-black leading-[1.02] tracking-[-0.045em] text-[#102A43] sm:text-[46px] xl:text-[52px]">
              Дижитал боломжийг<br />
              <span className="text-[#1677FF]">хүн бүрт</span>
            </h1>

            <p className="mt-4 max-w-[590px] text-[14px] font-medium leading-6 text-[#5B7290] sm:text-[15px]">
              {subtext}
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <button onClick={() => scrollTo('#products')} className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[#116EF0] px-5 text-[11px] font-extrabold text-white shadow-[0_8px_18px_rgba(17,110,240,.20)] hover:bg-[#0866D9]">
                Одоо худалдаж авах <ArrowRight className="size-3.5" />
              </button>
              <button onClick={() => scrollTo('#how')} className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-[#C9DBEE] bg-white/78 px-5 text-[11px] font-extrabold text-[#294A69] hover:bg-white">
                <ShieldCheck className="size-3.5 text-[#1677FF]" /> Манай давуу тал
              </button>
            </div>

            <div className="mt-5 grid max-w-[650px] grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                [ShieldCheck, '100% Найдвартай', 'Баталгаат үйлчилгээ'],
                [Zap, 'Шуурхай хүргэлт', 'Автомат илгээх'],
                [Headphones, '24/7 Дэмжлэг', 'Монгол хэлээр'],
                [Users, '10,000+', 'Аз жаргалтай хэрэглэгч'],
              ].map(([Icon, title, text]) => (
                <div key={String(title)} className="flex min-w-0 items-center gap-2 rounded-[12px] bg-white/50 p-2 ring-1 ring-white/80 backdrop-blur-sm">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-[#1677FF] shadow-[0_4px_12px_rgba(22,119,255,.10)] ring-1 ring-[#D4E4F8]">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[9.5px] font-extrabold text-[#173A60]">{String(title)}</span>
                    <span className="mt-0.5 block truncate text-[8px] font-semibold text-[#8195AC]">{String(text)}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden min-h-[260px] lg:block">
            <div className="absolute left-[3%] top-[10%] h-[212px] w-[69%] rounded-[36px] border border-white/65 bg-white/20 shadow-[0_28px_70px_rgba(37,98,172,.16)] backdrop-blur-md" />
            <div className="absolute left-[10%] top-[24%] h-[164px] w-[59%] -rotate-2 rounded-[28px] border border-white/75 bg-white/25 shadow-[0_18px_50px_rgba(37,98,172,.14)] backdrop-blur-md" />

            <div className="absolute left-[17%] top-[29%] grid size-[72px] place-items-center rounded-[20px] bg-gradient-to-br from-[#2A91FF] to-[#0968E5] text-white shadow-[0_16px_30px_rgba(24,103,221,.30)] ring-1 ring-white/70"><Facebook className="size-9 fill-white" /></div>
            <div className="absolute left-[34%] top-[16%] grid size-[67px] place-items-center rounded-[19px] bg-gradient-to-br from-[#FFB653] via-[#F45B96] to-[#7956F4] text-white shadow-[0_16px_28px_rgba(236,82,150,.24)] ring-1 ring-white/70"><Instagram className="size-8" /></div>
            <div className="absolute left-[52%] top-[23%] grid size-[66px] place-items-center rounded-[18px] bg-[#111824] text-white shadow-[0_16px_28px_rgba(12,22,38,.26)] ring-1 ring-white/55"><Music2 className="size-8" /></div>
            <div className="absolute left-[61%] top-[8%] grid size-[62px] place-items-center rounded-[17px] bg-white text-[#16A1E0] shadow-[0_15px_28px_rgba(22,119,255,.18)] ring-1 ring-white/80"><Bot className="size-8" /></div>
            <div className="absolute left-[38%] bottom-[10%] grid size-[56px] place-items-center rounded-[16px] bg-white text-[#FF3030] shadow-[0_14px_24px_rgba(22,119,255,.14)] ring-1 ring-white/80"><Youtube className="size-7 fill-[#FF3030]" /></div>
            <div className="absolute left-[55%] bottom-[7%] grid size-[58px] place-items-center rounded-[16px] bg-[#111824] text-white shadow-[0_14px_26px_rgba(12,22,38,.22)] ring-1 ring-white/60"><span className="text-[22px] font-black">X</span></div>
            <div className="absolute left-[70%] bottom-[15%] grid size-[58px] place-items-center rounded-[16px] bg-gradient-to-br from-[#39C6FF] to-[#149AE3] text-white shadow-[0_14px_26px_rgba(22,119,255,.20)] ring-1 ring-white/70"><Send className="size-7" /></div>

            <div className="absolute right-0 top-[7%] w-[205px] rounded-[18px] bg-[linear-gradient(145deg,#0B3B86,#0B2D68)] p-5 text-white shadow-[0_18px_45px_rgba(11,45,104,.24)] ring-1 ring-white/15">
              <div className="flex items-center gap-2"><Sparkles className="size-5 text-[#FFD25D]" /><span className="text-[9px] font-black tracking-[.08em] text-[#C9DCFF]">SOCIALTOOL.STORE</span></div>
              <p className="mt-4 text-[16px] font-black leading-5">“Жижиг бизнесээс<br />том боломж руу”</p>
              <div className="mt-4 space-y-2">
                {['Баталгаат үйлчилгээ', 'Хурдан хүргэлт', 'Аюулгүй төлбөр', 'Тогтмол шинэ бүтээгдэхүүн'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-[9.5px] font-semibold text-[#E6F0FF]"><span className="grid size-4 place-items-center rounded-full bg-[#1BC778] text-white"><Check className="size-2.5" /></span>{item}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
