'use client'

import { useState } from 'react'
import { Loader2, User, Mail, Phone, Lock, Send, UserPlus, LogIn, ShieldCheck } from 'lucide-react'
import {
  Dialog, DialogContent, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  telegram: string | null
}

interface Props {
  open: boolean
  onClose: () => void
  onAuthed: (customer: Customer) => void
  initialMode?: 'login' | 'register'
}

export function AuthModal({ open, onClose, onAuthed, initialMode = 'login' }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', telegram: '' })
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = mode === 'register' ? '/api/auth/register' : '/api/auth/login'
      const body =
        mode === 'register'
          ? { name: form.name, phone: form.phone, email: form.email, password: form.password, telegram: form.telegram }
          : { email: form.email, password: form.password }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Алдаа')
      toast.success(mode === 'register' ? 'Амжилттай бүртгүүллээ' : 'Амжилттай нэвтэрлээ')
      onAuthed(data.customer)
      setForm({ name: '', phone: '', email: '', password: '', telegram: '' })
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Алдаа гарлаа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md p-0 bg-white border-[#D6E4FF] overflow-hidden max-h-[94vh]">
        <DialogTitle className="sr-only">{mode === 'register' ? 'Бүртгүүлэх' : 'Нэвтрэх'}</DialogTitle>
        <div className="max-h-[94vh] overflow-y-auto custom-scroll">
          {/* header */}
          <div className="px-6 pt-6 pb-4 bg-gradient-to-br from-[#E8F1FF] to-white border-b border-[#EEF4FF]">
            <div className="flex items-center gap-2.5">
              <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#1677FF] to-[#0B4DBA] shadow-premium">
                {mode === 'register' ? <UserPlus className="size-5 text-white" /> : <LogIn className="size-5 text-white" />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#102A43]">
                  {mode === 'register' ? 'Бүртгэл үүсгэх' : 'Нэвтрэх'}
                </h2>
                <p className="text-xs text-[#5B7290]">
                  {mode === 'register' ? 'Захиалга, төлбөрөө хадгалахын тулд бүртгүүлнэ үү' : 'Бүртгэлтэй хэрэглэгчээр нэвтэрнэ үү'}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={submit} className="p-6 space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <Label className="text-xs font-semibold text-[#102A43] flex items-center gap-1">
                    <User className="size-3.5" /> Нэр
                  </Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 border-[#D6E4FF]" placeholder="Таны нэр" required />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-[#102A43] flex items-center gap-1">
                    <Phone className="size-3.5" /> Утас
                  </Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 border-[#D6E4FF]" placeholder="99112233" required />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-[#102A43] flex items-center gap-1">
                    <Send className="size-3.5" /> Telegram (опц)
                  </Label>
                  <Input value={form.telegram} onChange={(e) => setForm({ ...form, telegram: e.target.value })} className="mt-1 border-[#D6E4FF]" placeholder="@username" />
                </div>
              </>
            )}
            <div>
              <Label className="text-xs font-semibold text-[#102A43] flex items-center gap-1">
                <Mail className="size-3.5" /> И-мэйл
              </Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 border-[#D6E4FF]" placeholder="you@example.com" required />
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#102A43] flex items-center gap-1">
                <Lock className="size-3.5" /> Нууц үг
              </Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1 border-[#D6E4FF]" placeholder="••••••" required minLength={mode === 'register' ? 6 : 1} />
              {mode === 'register' && <p className="mt-1 text-[11px] text-[#5B7290]">Хамгийн багадаа 6 тэмдэгт</p>}
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white shadow-premium-lg gap-2">
              {loading ? <Loader2 className="size-4 animate-spin" /> : mode === 'register' ? <UserPlus className="size-4" /> : <LogIn className="size-4" />}
              {mode === 'register' ? 'Бүртгүүлэх' : 'Нэвтрэх'}
            </Button>

            <div className="text-center text-sm text-[#5B7290]">
              {mode === 'register' ? (
                <>
                  Бүртгэлтэй юу?{' '}
                  <button type="button" onClick={() => setMode('login')} className="font-bold text-[#1677FF] hover:underline">
                    Нэвтрэх
                  </button>
                </>
              ) : (
                <>
                  Бүртгэлгүй юу?{' '}
                  <button type="button" onClick={() => setMode('register')} className="font-bold text-[#1677FF] hover:underline">
                    Бүртгүүлэх
                  </button>
                </>
              )}
            </div>
            <p className="flex items-center justify-center gap-1.5 text-[11px] text-[#5B7290]">
              <ShieldCheck className="size-3.5 text-[#16A34A]" />
              Таны мэдээлэл аюулгүй хадгалагдана
            </p>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
