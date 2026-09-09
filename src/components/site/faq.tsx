'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { HelpCircle, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface Faq {
  id: string
  q: string
  a: string
}

export function Faq({ faqs }: { faqs: Faq[] }) {
  return (
    <section id="faq" className="relative py-16 lg:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D6E4FF] bg-white px-3 py-1 text-xs font-semibold text-[#1677FF]">
            <HelpCircle className="size-3.5" /> Түгээмэл асуулт
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#102A43]">
            Таны асуусан <span className="gradient-text">асуултууд</span>
          </h2>
          <p className="mt-3 text-[#5B7290]">Хариулт нь энд байгаа — хэрвээ олдохгүй бол админтай ярина уу</p>
        </div>

        <div className="mt-8 rounded-2xl border border-[#D6E4FF] bg-white shadow-premium overflow-hidden">
          <Accordion type="single" collapsible defaultValue="faq-0">
            {faqs.map((f, i) => (
              <AccordionItem key={f.id} value={`faq-${i}`} className="border-b border-[#EEF4FF] last:border-0">
                <AccordionTrigger className="px-5 py-4 text-left text-[15px] font-semibold text-[#102A43] hover:no-underline hover:bg-[#F5F9FF]">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5 text-sm text-[#5B7290] leading-relaxed">
                  {f.a.replace(/wire\.mn/gi, 'Qpay')}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
          <p className="text-sm text-[#5B7290]">Бусад асуулт байна уу?</p>
          <Button
            variant="outline"
            className="rounded-full border-[#D6E4FF] text-[#1677FF] hover:bg-[#E8F1FF] gap-2"
            onClick={() => window.dispatchEvent(new Event('st-open-chat'))}
          >
            <MessageCircle className="size-4" />
            Админтай холбогдох
          </Button>
        </div>
      </div>
    </section>
  )
}
