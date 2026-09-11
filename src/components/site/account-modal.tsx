'use client'

import { useEffect, useState } from 'react'
import {
  Dialog, DialogContent, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  User, ShoppingBag, CreditCard, LogOut, Loader2, Check, Package, Phone, Send, Mail, Copy,
} from 'lucide-react'
import type { Customer } from './auth-modal'
import { formatTugrik, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
  customer: Customer | null
  onLogout: () => void
  onProfileUpdate: (c: Customer) => void
}

type Tab = 'profile' | 'orders' | 'payments'

interface MyOrder {
  id: string
  orderNumber: string
  totalAmount: number
  status: string
  statusLabel: string
  createdAt: string
  itemCount: number
  items: { id: string; productName: string; price: number; quantity: number }[]
  payment: { status: string; invoiceNumber: string | null; paidAt: string | null } | null
}

export function AccountModal({ open, onClose, customer, onLogout, onProfileUpdate }: Props) {
  const [tab, setTab] = useState<Tab>('profile')
  const [orders, setOrders] = useState<MyOrder[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [profile, setProfile] = useState({ name: '', phone: '', telegram: '' })
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    if (customer) setProfile({ name: customer.name, phone: customer.phone, telegram: customer.telegram || '' })
  }, [customer])

  useEffect(() => {
    if (!open || !customer) return
    setLoadingOrders(true)
    fetch('/api/customer/orders')
      .then((r) => r.json())
      .then((d) => setOrders(Array.isArray(d) ? d : []))
      .catch(() => setOrders([]))
      .finally(() => setLoadingOrders(false))
  }, [open, customer])

  const saveProfile = async () => {
    setSavingProfile(true)
    try {
      const res = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onProfileUpdate(data.customer)
      toast.success('Профайл шинэчлэгдлээ')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Алдаа')
    } finally {
      setSavingProfile(false)
    }
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    onLogout()
    onClose()
    toast.success('Гарлаа')
  }

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} хуулагдлаа`)
  }

  if (!customer) return null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="store-dialog sm:max-w-2xl p-0 bg-white border-[#D6E4FF] overflow-hidden max-h-[94vh]">
        <DialogTitle className="sr-only">Миний бүртгэл</DialogTitle>
        <div className="max-h-[94vh] overflow-y-auto custom-scroll">
          {/* header */}
          <div className="px-6 py-5 bg-gradient-to-r from-[#E8F1FF] to-white border-b border-[#EEF4FF]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#1677FF] to-[#0B4DBA] text-white font-bold shadow-premium">
                  {customer.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-[#102A43] truncate">{customer.name}</h2>
                  <p className="text-xs text-[#5B7290] truncate">{customer.email}</p>
                </div>
              </div>
              <Button onClick={logout} variant="outline" size="sm" className="rounded-full border-[#D6E4FF] text-[#5B7290] hover:text-red-500 hover:border-red-200 gap-1.5">
                <LogOut className="size-4" /> Гарах
              </Button>
            </div>
          </div>

          {/* tabs */}
          <div className="px-6 pt-4 flex gap-2">
            {[
              { id: 'profile', label: 'Профайл', Icon: User },
              { id: 'orders', label: 'Миний захиалга', Icon: ShoppingBag },
              { id: 'payments', label: 'Төлбөрүүд', Icon: CreditCard },
            ].map((t) => {
              const { Icon } = t
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as Tab)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                    tab === t.id
                      ? 'bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white shadow-premium'
                      : 'bg-white border border-[#D6E4FF] text-[#102A43] hover:bg-[#E8F1FF]'
                  )}
                >
                  <Icon className="size-4" />
                  {t.label}
                </button>
              )
            })}
          </div>

          <div className="p-6">
            {tab === 'profile' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-[#D6E4FF] bg-[#F5F9FF]/50 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-[#5B7290]">
                    <Mail className="size-3.5" /> {customer.email}
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#E8F1FF] text-[#0B4DBA] font-semibold">өөрчлөх боломжгүй</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-[#102A43]">Нэр</Label>
                  <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="mt-1 border-[#D6E4FF]" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-[#102A43]">Утас</Label>
                  <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="mt-1 border-[#D6E4FF]" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-[#102A43]">Telegram</Label>
                  <Input value={profile.telegram} onChange={(e) => setProfile({ ...profile, telegram: e.target.value })} className="mt-1 border-[#D6E4FF]" placeholder="@username" />
                </div>
                <Button onClick={saveProfile} disabled={savingProfile} className="rounded-xl bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white gap-2">
                  {savingProfile ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                  Хадгалах
                </Button>
              </div>
            )}

            {(tab === 'orders' || tab === 'payments') && (
              <div className="space-y-3">
                {loadingOrders ? (
                  <div className="grid place-items-center py-12"><Loader2 className="size-7 animate-spin text-[#1677FF]" /></div>
                ) : orders.length === 0 ? (
                  <div className="py-12 text-center">
                    <Package className="mx-auto size-10 text-[#5B7290]/40" />
                    <p className="mt-3 text-sm text-[#5B7290]">Захиалга байхгүй байна</p>
                    <Button onClick={onClose} className="mt-4 rounded-full bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white">
                      Хэрэгсэл үзэх
                    </Button>
                  </div>
                ) : (
                  orders
                    .filter((o) => tab !== 'payments' || !!o.payment)
                    .map((o) => (
                      <div key={o.id} className="rounded-2xl border border-[#D6E4FF] bg-white shadow-premium overflow-hidden">
                        <div className="px-4 py-3 flex items-center justify-between border-b border-[#EEF4FF] bg-[#F5F9FF]/40">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#0B4DBA]">#{o.orderNumber}</span>
                            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold border', ORDER_STATUS_COLOR[o.status])}>
                              {o.statusLabel}
                            </span>
                          </div>
                          <span className="text-xs text-[#5B7290]">{new Date(o.createdAt).toLocaleString('mn-MN')}</span>
                        </div>
                        <div className="p-4 space-y-1.5">
                          {o.items.map((it) => (
                            <div key={it.id} className="flex items-center justify-between text-sm">
                              <span className="text-[#102A43]">{it.productName} <span className="text-[#5B7290]">×{it.quantity}</span></span>
                              <span className="text-[#102A43] font-medium">{formatTugrik(it.price * it.quantity)}</span>
                            </div>
                          ))}
                          <div className="flex items-center justify-between pt-2 border-t border-[#EEF4FF]">
                            <span className="text-sm font-bold text-[#102A43]">Нийт</span>
                            <span className="text-base font-extrabold text-[#102A43]">{formatTugrik(o.totalAmount)}</span>
                          </div>
                          {tab === 'payments' && o.payment && (
                            <div className="mt-2 pt-2 border-t border-[#EEF4FF] text-xs text-[#5B7290] space-y-1">
                              <p>Төлбөрийн төлөв: <span className="font-semibold text-[#102A43]">{o.payment.status === 'PAID' ? 'Төлөгдсөн' : o.payment.status === 'PENDING' ? 'Хүлээгдэж байна' : o.payment.status}</span></p>
                              {o.payment.invoiceNumber && <p>Нэхэмжлэл: {o.payment.invoiceNumber}</p>}
                              {o.payment.paidAt && <p className="text-[#16A34A]">Төлсөн: {new Date(o.payment.paidAt).toLocaleString('mn-MN')}</p>}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
