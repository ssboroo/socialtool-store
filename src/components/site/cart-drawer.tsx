'use client'

import { useEffect } from 'react'
import { ShoppingCart, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useCartStore, useUIStore } from '@/store/cart'
import { cartKey } from '@/lib/license'
import { formatTugrik } from '@/lib/format'
import { ProductIllustration } from './product-illustration'

export function CartDrawer() {
  const { items, isOpen, close, setQty, remove, total, syncBusy } = useCartStore()
  const openCheckout = useUIStore((s) => s.openCheckout)

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleCheckout = () => {
    close()
    setTimeout(() => openCheckout(), 200)
  }

  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && close()}>
      <SheetContent
        side="right"
        className="w-full p-0 bg-white border-[#D6E4FF] sm:max-w-md"
      >
        <SheetHeader className="border-b border-[#EEF4FF] px-5 pt-5 pb-3">
          <SheetTitle className="flex items-center gap-2 text-[#102A43]">
            <ShoppingCart className="size-5 text-[#1677FF]" />
            Таны сагс
          </SheetTitle>
          <SheetDescription className="text-[#5B7290]">
            {items.length === 0 ? 'Сагс хоосон байна' : `${items.length} төрлийн хэрэгсэл`}
            {syncBusy ? ' · шинэчилж байна…' : ''}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="grid size-20 place-items-center rounded-2xl bg-[#E8F1FF]">
              <ShoppingBag className="size-9 text-[#1677FF]" />
            </div>
            <h3 className="mt-5 text-base font-bold text-[#102A43]">Сагс хоосон байна</h3>
            <p className="mt-1 text-sm text-[#5B7290]">Хэрэгсэл сонгож сагсанд нэмээрэй</p>
            <Button
              onClick={close}
              className="mt-5 rounded-full bg-gradient-to-r from-[#1677FF] to-[#0B4DBA]"
            >
              Хэрэгсэл үзэх
            </Button>
          </div>
        ) : (
          <>
            <div className="custom-scroll flex-1 space-y-2.5 overflow-y-auto px-3 py-3">
              {items.map((it) => {
                const key = cartKey(it)
                return (
                  <div
                    key={key}
                    className="flex gap-3 rounded-2xl border border-[#D6E4FF] bg-white p-3 shadow-premium"
                  >
                    <ProductIllustration icon={it.icon} className="size-16 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="line-clamp-1 text-sm font-bold text-[#102A43]">{it.name}</h4>
                          <p className="text-xs text-[#5B7290]">{it.category}</p>
                          {it.duration ? (
                            <p className="mt-0.5 text-[11px] font-semibold text-[#0B4DBA]">{it.duration}</p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(key)}
                          disabled={syncBusy}
                          className="grid size-8 shrink-0 place-items-center rounded-lg text-[#5B7290] transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`${it.name} сагснаас устгах`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="inline-flex items-center rounded-lg border border-[#D6E4FF] bg-white">
                          <button
                            type="button"
                            onClick={() => setQty(key, it.quantity - 1)}
                            className="grid size-8 place-items-center text-[#5B7290] hover:text-[#1677FF] disabled:opacity-40"
                            disabled={it.quantity <= 1 || syncBusy}
                            aria-label="Тоо ширхэг багасгах"
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="min-w-7 text-center text-sm font-bold text-[#102A43]">{it.quantity}</span>
                          <button
                            type="button"
                            onClick={() => setQty(key, it.quantity + 1)}
                            className="grid size-8 place-items-center text-[#5B7290] hover:text-[#1677FF] disabled:opacity-40"
                            disabled={it.quantity >= 99 || syncBusy}
                            aria-label="Тоо ширхэг нэмэх"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                        <span className="text-sm font-bold text-[#102A43]">{formatTugrik(it.price * it.quantity)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="space-y-3 border-t border-[#EEF4FF] bg-[#F5F9FF]/60 p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#5B7290]">Нийт дүн</span>
                <span className="text-2xl font-extrabold text-[#102A43]">{formatTugrik(total())}</span>
              </div>
              <Button
                onClick={handleCheckout}
                disabled={syncBusy}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-base font-bold text-white shadow-premium-lg hover:shadow-premium-lg"
              >
                Төлбөр төлөх
                <ArrowRight className="size-4" />
              </Button>
              <p className="text-center text-xs text-[#5B7290]">Аюулгүй төлбөр — QPay</p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
