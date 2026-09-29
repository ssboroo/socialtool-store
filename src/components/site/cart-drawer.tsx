'use client'

import { useEffect } from 'react'
import { ShoppingCart, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
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
import { QuantityControl } from './quantity-control'
import { PurchasePrice } from './purchase-price'
import { LicenseTermLabel } from './license-selector'
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
        className="customer-surface w-full p-0 bg-card border-border sm:max-w-md"
      >
        <SheetHeader className="border-b border-border px-5 pt-5 pb-3">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <ShoppingCart className="size-5 text-[#1677FF]" />
            Таны сагс
          </SheetTitle>
          <SheetDescription className="text-muted-foreground">
            {items.length === 0 ? 'Сагс хоосон байна' : `${items.length} төрлийн хэрэгсэл`}
            {syncBusy ? ' · шинэчилж байна…' : ''}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="grid size-20 place-items-center rounded-2xl bg-accent">
              <ShoppingBag className="size-9 text-[#1677FF]" />
            </div>
            <h3 className="mt-5 text-base font-bold text-foreground">Сагс хоосон байна</h3>
            <p className="mt-1 text-sm text-muted-foreground">Хэрэгсэл сонгож сагсанд нэмээрэй</p>
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
                    className="flex min-h-[98px] items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-premium"
                  >
                    <ProductIllustration icon={it.icon} name={it.name} category={it.category} compact className="size-[72px] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="line-clamp-2 min-h-[40px] text-sm font-bold leading-5 text-foreground">{it.name}</h4>
                          <p className="text-xs text-muted-foreground">{it.category}</p>
                          {it.duration ? (
                            <LicenseTermLabel value={it.duration} />
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(key)}
                          disabled={syncBusy}
                          className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`${it.name} сагснаас устгах`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <div className="mt-2 flex flex-wrap min-h-8 items-center justify-between gap-2">
                        <QuantityControl value={it.quantity} onChange={value => setQty(key, value)} disabled={syncBusy} />
                        <PurchasePrice amount={it.price * it.quantity} className="text-sm" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="space-y-3 border-t border-border bg-muted/60 p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Нийт дүн</span>
                <PurchasePrice amount={total()} className="text-2xl" />
              </div>
              <Button
                onClick={handleCheckout}
                disabled={syncBusy}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-base font-bold text-white shadow-premium-lg hover:shadow-premium-lg"
              >
                Төлбөр төлөх
                <ArrowRight className="size-4" />
              </Button>
              <p className="text-center text-xs text-muted-foreground">Аюулгүй төлбөр — QPay</p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
