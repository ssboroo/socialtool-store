'use client'
import { QuantityInput } from './quantity-input'
import { cartKey } from '@/lib/license'

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
import { formatTugrik } from '@/lib/format'
import { ProductIllustration } from './product-illustration'

export function CartDrawer() {
  const { items, isOpen, close, setQty, remove, total } = useCartStore()
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
        className="w-full sm:max-w-md p-0 bg-white border-[#D6E4FF]"
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-[#EEF4FF]">
          <SheetTitle className="flex items-center gap-2 text-[#102A43]">
            <ShoppingCart className="size-5 text-[#1677FF]" />
            Таны сагс
          </SheetTitle>
          <SheetDescription className="text-[#5B7290]">
            {items.length === 0 ? 'Сагс хоосон байна' : `${items.length} төрлийн хэрэгсэл`}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="grid size-20 place-items-center rounded-2xl bg-[#E8F1FF]">
              <ShoppingBag className="size-9 text-[#1677FF]" />
            </div>
            <h3 className="mt-5 text-base font-bold text-[#102A43]">Сагс хоосон байна</h3>
            <p className="mt-1 text-sm text-[#5B7290]">
              Хэрэгсэл сонгож сагсанд нэмээрэй
            </p>
            <Button
              onClick={close}
              className="mt-5 rounded-full bg-gradient-to-r from-[#1677FF] to-[#0B4DBA]"
            >
              Хэрэгсэл үзэх
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto custom-scroll px-3 py-3 space-y-2.5">
              {items.map((it) => (
                <div
                  key={cartKey(it)}
                  className="flex gap-3 rounded-2xl border border-[#D6E4FF] bg-white p-3 shadow-premium"
                >
                  <ProductIllustration icon={it.icon} className="size-16 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-[#102A43] line-clamp-1">{it.name}</h4>
                        <p className="text-xs text-[#5B7290]">{it.category}{it.duration ? ` · ${it.duration}` : ' · ширхэг'}</p>
                      </div>
                      <button
                        onClick={() => remove(cartKey(it))}
                        className="grid size-7 place-items-center rounded-lg text-[#5B7290] hover:bg-red-50 hover:text-red-500 transition-colors"
                        aria-label="Устгах"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-lg border border-[#D6E4FF] bg-white">
                        <button
                          onClick={() => setQty(cartKey(it), it.quantity - 1)}
                          className="grid size-8 place-items-center text-[#5B7290] hover:text-[#1677FF] disabled:opacity-40"
                          disabled={it.quantity <= 1}
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <QuantityInput value={it.quantity} onChange={qty => setQty(cartKey(it), qty)} label={`${it.name} тоо ширхэг`} />
                        <button
                          onClick={() => setQty(cartKey(it), it.quantity + 1)}
                          className="grid size-8 place-items-center text-[#5B7290] hover:text-[#1677FF]"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-[#102A43]">
                        {formatTugrik(it.price * it.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#EEF4FF] p-5 space-y-3 bg-[#F5F9FF]/60">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#5B7290]">Нийт дүн</span>
                <span className="text-2xl font-extrabold text-[#102A43]">
                  {formatTugrik(total())}
                </span>
              </div>
              <Button
                onClick={handleCheckout}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white shadow-premium-lg hover:shadow-premium-lg text-base font-bold gap-2"
              >
                Төлбөр төлөх
                <ArrowRight className="size-4" />
              </Button>
              <p className="text-center text-xs text-[#5B7290]">
                Аюулгүй төлбөр — Qpay системээр
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
