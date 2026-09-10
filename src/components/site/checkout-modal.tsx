'use client'
import { cartKey } from '@/lib/license'

import { useEffect, useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ShoppingCart,
  Loader2,
  CheckCircle2,
  XCircle,
  Copy,
  ShieldCheck,
  Clock,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react'
import { useUIStore, useCartStore } from '@/store/cart'
import { useCustomer } from '@/hooks/use-customer'
import { formatTugrik } from '@/lib/format'
import { toast } from 'sonner'

type Step = 'form' | 'pay' | 'status' | 'success' | 'failed'

export function CheckoutModal() {
  const open = useUIStore((s) => s.checkoutOpen)
  const close = useUIStore((s) => s.closeCheckout)
  const { items, total, clear } = useCartStore()
  const { customer } = useCustomer()

  const [step, setStep] = useState<Step>('form')
  const [form, setForm] = useState({ name: '', phone: '', email: '', telegram: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [order, setOrder] = useState<{ orderNumber: string; orderId: string; amount: number } | null>(null)
  const [invoice, setInvoice] = useState<{ payUrl: string; qrUrl?: string; invoiceNumber: string; demo: boolean } | null>(null)
  const [polling, setPolling] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [pollAttempt, setPollAttempt] = useState(0)
  const [pendingOrder, setPendingOrder] = useState<{ fingerprint: string; order: { orderNumber: string; orderId: string; amount: number } } | null>(null)
  const submittingRef = useRef(false)

  const [previousOpen, setPreviousOpen] = useState(false)
  const [previousCustomer, setPreviousCustomer] = useState(customer?.id)
  if (open !== previousOpen || customer?.id !== previousCustomer) {
    setPreviousOpen(open)
    setPreviousCustomer(customer?.id)
    if (customer?.id !== previousCustomer || (open && step === 'success')) {
      setStep('form')
      setOrder(null)
      setInvoice(null)
      setPendingOrder(null)
    } else if (open) setStep(invoice && order ? 'pay' : 'form')
    if (open || customer?.id !== previousCustomer) {
      setErrors({})
      setPaymentError('')
      if (customer) setForm({ name: customer.name, phone: customer.phone, email: customer.email, telegram: customer.telegram || '' })
      else if (previousCustomer) setForm({ name: '', phone: '', email: '', telegram: '' })
    }
  }

  // Bounded, cancellable polling; a timeout always leaves a working retry button.
  useEffect(() => {
    if (!open || step !== 'status' || !order) return
    let stopped = false
    let timer: ReturnType<typeof setTimeout>
    let attempts = 0
    const controller = new AbortController()
    const poll = async () => {
      try {
        const res = await fetch(`/api/payment/wire/status?orderId=${encodeURIComponent(order.orderId)}`, {
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]), cache: 'no-store',
        })
        const data = await res.json()
        if (stopped) return
        if (!res.ok) throw new Error(data.error || 'Төлбөрийн төлөв шалгах боломжгүй байна')
        setPaymentError('')
        if (data.status === 'PAID') {
          setPolling(false)
          setStep('success')
          clear()
          setPendingOrder(null)
          return
        }
        if (data.status === 'FAILED' || data.status === 'EXPIRED') {
          setPolling(false)
          setStep('failed')
          return
        }
      } catch (error) {
        if (stopped) return
        setPaymentError(error instanceof Error ? error.message : 'Холболт тасарлаа. Дахин шалгана уу.')
      }
      if (++attempts >= 200) {
        setPolling(false)
        setPaymentError('Автомат шалгалт түр зогслоо. Дахин шалгах товчийг дарна уу.')
        return
      }
      timer = setTimeout(poll, 3000)
    }
    void poll()
    return () => { stopped = true; clearTimeout(timer); controller.abort() }
  }, [open, step, order, clear, pollAttempt])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Нэр оруулна уу'
    if (!form.phone.trim()) e.phone = 'Утас оруулна уу'
    else if (form.phone.replace(/\D/g, '').length < 7) e.phone = 'Утас зөв оруулна уу'
    if (!form.email.trim()) e.email = 'И-мэйл оруулна уу'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'И-мэйл зөв биш'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submitOrder = async () => {
    if (submittingRef.current || !validate()) return
    submittingRef.current = true
    setSubmitting(true)
    setPaymentError('')
    const payload = {
      customerName: form.name, phone: form.phone, email: form.email, telegram: form.telegram || null,
      items: items.map(i => ({ productId: i.id, duration: i.duration || '', name: i.name, price: i.price, quantity: i.quantity })),
    }
    const fingerprint = JSON.stringify([customer?.id || '', payload])
    try {
      let currentOrder = pendingOrder?.fingerprint === fingerprint ? pendingOrder.order : null
      if (!currentOrder) {
        const res = await fetch('/api/orders', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Захиалга үүсгэхэд алдаа гарлаа')
        currentOrder = { orderNumber: data.orderNumber, orderId: data.orderId, amount: data.amount }
        setPendingOrder({ fingerprint, order: currentOrder })
      }
      setOrder(currentOrder)
      const inv = await fetch('/api/payment/wire/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: currentOrder.orderId }),
      })
      const invData = await inv.json()
      if (!inv.ok) {
        if (invData.code === 'already_paid') { setPolling(true); setStep('status'); return }
        throw new Error(invData.error || 'Төлбөрийн нэхэмжлэл үүсгэхэд алдаа гарлаа')
      }
      setInvoice({ payUrl: invData.payUrl, invoiceNumber: invData.invoiceNumber, demo: invData.demo })
      setStep('pay')
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Алдаа гарлаа'
      setPaymentError(message)
      toast.error(message)
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const startPolling = () => {
    // The status endpoint reads the DB (updated by the Qpay webhook) and
    // also queries the Qpay API directly as a server-side fallback — so
    // polling alone confirms the payment, never the frontend redirect.
    setPolling(true)
    setPaymentError('')
    setStep('status')
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-lg p-0 bg-white border-[#D6E4FF] overflow-hidden max-h-[94vh]">
        <DialogTitle className="sr-only">Төлбөр төлөх</DialogTitle>
        <div className="max-h-[94vh] overflow-y-auto custom-scroll">
          {/* header */}
          <div className="px-6 py-5 border-b border-[#EEF4FF] bg-gradient-to-r from-[#E8F1FF] to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#1677FF] to-[#0B4DBA] shadow-premium">
                  <ShoppingCart className="size-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#102A43]">Төлбөр төлөх</h2>
                  <p className="text-xs text-[#5B7290]">
                    {step === 'form' && 'Хүргэгдэх мэдээлэл'}
                    {step === 'pay' && 'Qpay нэхэмжлэл'}
                    {step === 'status' && 'Төлбөр шалгагдаж байна'}
                    {step === 'success' && 'Төлбөр амжилттай'}
                    {step === 'failed' && 'Төлбөр төлөгдсөнгүй'}
                  </p>
                </div>
              </div>
              {order && (
                <div className="text-right">
                  <div className="text-[10px] uppercase text-[#5B7290] tracking-wide">Захиалга</div>
                  <div className="text-sm font-bold text-[#0B4DBA]">#{order.orderNumber}</div>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {paymentError && <p role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{paymentError}</p>}
            {/* STEP: form */}
            {step === 'form' && (
              <div className="space-y-4">
                {items.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-[#5B7290]">Сагс хоосон байна</p>
                    <Button onClick={close} className="mt-4 rounded-full bg-gradient-to-r from-[#1677FF] to-[#0B4DBA]">
                      Хэрэгсэл үзэх
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* items summary */}
                    <div className="rounded-2xl border border-[#D6E4FF] bg-[#F5F9FF]/50 divide-y divide-[#EEF4FF]">
                      {items.map((it) => (
                        <div key={cartKey(it)} className="flex items-center justify-between p-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#102A43] truncate">{it.name}</p>
                            <p className="text-xs text-[#5B7290]">{it.category}{it.duration ? ` · ${it.duration}` : ' · ширхэг'} ×{it.quantity}</p>
                          </div>
                          <span className="text-sm font-bold text-[#102A43]">
                            {formatTugrik(it.price * it.quantity)}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between p-3 bg-white">
                        <span className="text-sm font-semibold text-[#102A43]">Нийт дүн</span>
                        <span className="text-lg font-extrabold text-[#102A43]">{formatTugrik(total())}</span>
                      </div>
                    </div>

                    {/* form */}
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="co-name" className="text-xs font-semibold text-[#102A43]">Нэр *</Label>
                        <Input
                          id="co-name"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="Таны нэр"
                          className={errors.name ? 'border-red-400' : 'border-[#D6E4FF]'}
                        />
                        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="co-phone" className="text-xs font-semibold text-[#102A43]">Утас *</Label>
                          <Input
                            id="co-phone"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            placeholder="99112233"
                            className={errors.phone ? 'border-red-400' : 'border-[#D6E4FF]'}
                          />
                          {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                        </div>
                        <div>
                          <Label htmlFor="co-tg" className="text-xs font-semibold text-[#102A43]">Telegram</Label>
                          <Input
                            id="co-tg"
                            value={form.telegram}
                            onChange={(e) => setForm({ ...form, telegram: e.target.value })}
                            placeholder="@username"
                            className="border-[#D6E4FF]"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="co-email" className="text-xs font-semibold text-[#102A43]">И-мэйл *</Label>
                        <Input
                          id="co-email"
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="you@example.com"
                          className={errors.email ? 'border-red-400' : 'border-[#D6E4FF]'}
                        />
                        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                      </div>
                    </div>

                    <Button
                      onClick={submitOrder}
                      disabled={submitting}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white shadow-premium-lg text-base font-bold gap-2"
                    >
                      {submitting ? (
                        <><Loader2 className="size-4 animate-spin" /> Үүсгэж байна...</>
                      ) : (
                        <>Төлбөрийн нэхэмжлэл үүсгэх</>
                      )}
                    </Button>
                    <p className="text-center text-xs text-[#5B7290] flex items-center justify-center gap-1.5">
                      <ShieldCheck className="size-3.5 text-[#16A34A]" />
                      Таны мэдээлэл аюулгүй хадгалагдана
                    </p>
                  </>
                )}
              </div>
            )}

            {/* STEP: pay */}
            {step === 'pay' && invoice && order && (
              <div className="space-y-5 text-center">
                {invoice.demo && (
                  <div className="rounded-xl bg-[#FFF5E6] border border-[#F59E0B]/20 px-3 py-2 text-xs text-[#92400E] text-left">
                    <strong>Демо горим:</strong> Энэ нь туршилтын төлбөрийн дэлгэц. Бодит мөнгө шилжүүлэхгүй.
                  </div>
                )}
                <div>
                  <p className="text-sm text-[#5B7290]">Төлөх дүн</p>
                  <p className="mt-1 text-4xl font-extrabold text-[#102A43]">{formatTugrik(order.amount)}</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-xl bg-[#E8F1FF] px-3 py-1.5 text-xs font-semibold text-[#0B4DBA]">
                  <Clock className="size-3.5" /> Захиалга: {invoice.invoiceNumber}
                </div>

                <div className="rounded-2xl border border-[#D6E4FF] bg-[#F5F9FF]/60 p-4 text-left">
                  <p className="text-sm font-bold text-[#102A43] flex items-center gap-1.5">
                    <ShieldCheck className="size-4 text-[#16A34A]" /> Аюулгүй төлбөр — Qpay
                  </p>
                  <p className="mt-1.5 text-xs text-[#5B7290] leading-relaxed">
                    Доорх товчийг дарж Qpay төлбөрийн хуудас руу шилжинэ үү. Төлбөрөө хийсний дараа энэ хуудас автомат хариуг хүлээж байна.
                  </p>
                </div>

                {invoice.payUrl && invoice.payUrl !== '#demo-payment' && (
                  <a
                    href={invoice.payUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={startPolling}
                    className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white shadow-premium-lg text-base font-bold transition-all hover:shadow-premium-lg"
                  >
                    <ExternalLink className="size-5" /> Qpay-аар төлөх
                  </a>
                )}

                <Button
                  onClick={startPolling}
                  variant="outline"
                  className="w-full h-11 rounded-xl border-[#D6E4FF] text-[#102A43] gap-2"
                >
                  <CheckCircle2 className="size-4 text-[#16A34A]" />
                  Төлбөрөө төлсөн — шалгах
                </Button>

                <button
                  onClick={() => setStep('form')}
                  className="text-xs text-[#5B7290] hover:text-[#1677FF] inline-flex items-center gap-1"
                >
                  <ArrowLeft className="size-3" /> Буцах
                </button>
              </div>
            )}

            {/* STEP: status (polling) */}
            {step === 'status' && (
              <div className="py-10 text-center space-y-4">
                <div className="relative mx-auto w-fit">
                  <div className="absolute inset-0 rounded-full bg-[#1677FF]/20 blur-xl animate-pulse" />
                  <div className="relative grid size-20 place-items-center rounded-full bg-gradient-to-br from-[#1677FF] to-[#0B4DBA] shadow-premium-lg">
                    <Loader2 className="size-9 text-white animate-spin" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-[#102A43]">Төлбөрийг шалгаж байна</h3>
                <p className="text-sm text-[#5B7290] max-w-xs mx-auto">
                  Төлбөр баталгаажсан эсэхийг шалгаж байна. Та банкны апликейшнд төлбөрөө гүйцэтгээд хүлээнэ үү.
                </p>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#E8F1FF] px-3 py-1.5 text-xs font-semibold text-[#0B4DBA]">
                  <Clock className="size-3.5" /> {polling ? 'Автомат шалгалт хийгдэж байна' : 'Шалгалт түр зогссон'}
                </div>
                <div className="flex flex-col gap-2">
                  {!polling && <Button onClick={() => { setPolling(true); setPaymentError(''); setPollAttempt(n => n + 1) }} className="rounded-xl">Дахин шалгах</Button>}
                  {invoice?.payUrl && <a href={invoice.payUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-blue-200 px-4 py-3 text-sm font-semibold text-blue-700">Төлбөрийн хуудас нээх</a>}
                  <button onClick={() => setStep('pay')} className="py-2 text-sm text-blue-700">Буцах</button>
                </div>
              </div>
            )}

            {/* STEP: success */}
            {step === 'success' && order && (
              <div className="py-8 text-center space-y-5">
                <div className="relative mx-auto w-fit">
                  <div className="absolute inset-0 rounded-full bg-[#16A34A]/20 blur-xl" />
                  <div className="relative grid size-20 place-items-center rounded-full bg-gradient-to-br from-[#16A34A] to-[#0B4DBA] shadow-premium-lg">
                    <CheckCircle2 className="size-10 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-extrabold text-[#102A43]">Баярлалаа! 🎉</h3>
                <p className="text-sm text-[#5B7290] max-w-sm mx-auto">
                  Төлбөр амжилттай төлөгдлөө. Таны хэрэгсэл, хандалтын мэдээлэл
                  и-мэйл болон Telegram-аар тун удахгүй хүргэгдэх болно.
                </p>
                <div className="rounded-2xl border border-[#D6E4FF] bg-[#F5F9FF]/50 p-4 text-left">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#5B7290]">Захиалгын дугаар</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(order.orderNumber)
                        toast.success('Хуулагдлаа')
                      }}
                      className="inline-flex items-center gap-1 font-bold text-[#0B4DBA] hover:text-[#1677FF]"
                    >
                      #{order.orderNumber}
                      <Copy className="size-3" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-[#5B7290]">Төлөгдсөн дүн</span>
                    <span className="font-bold text-[#102A43]">{formatTugrik(order.amount)}</span>
                  </div>
                </div>
                <Button onClick={close} className="w-full h-12 rounded-xl bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white">
                  Үргэлжлүүлэх
                </Button>
              </div>
            )}

            {/* STEP: failed */}
            {step === 'failed' && (
              <div className="py-8 text-center space-y-5">
                <div className="relative mx-auto w-fit">
                  <div className="absolute inset-0 rounded-full bg-red-500/20 blur-xl" />
                  <div className="relative grid size-20 place-items-center rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-premium-lg">
                    <XCircle className="size-10 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-extrabold text-[#102A43]">Төлбөр амжилтгүй</h3>
                <p className="text-sm text-[#5B7290] max-w-sm mx-auto">
                  Төлбөр төлөгдсөнгүй эсвэл хугацаа дууслаа. Та дахин оролдоод үзнэ үү, эсвэл админтай холбогдоорой.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={submitOrder}
                    disabled={submitting}
                    className="flex-1 h-11 rounded-xl border-[#D6E4FF]"
                  >
                    Дахин оролдох
                  </Button>
                  <Button
                    onClick={() => {
                      close()
                      window.dispatchEvent(new Event('st-open-chat'))
                    }}
                    className="flex-1 h-11 rounded-xl bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white"
                  >
                    Админтай ярих
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
