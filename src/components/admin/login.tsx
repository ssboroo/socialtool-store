'use client'

import { useState } from 'react'
import { Loader2, Lock, User, ShieldCheck, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function AdminLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Алдаа')
      onLogin(data.token)
      toast.success('Амжилттай нэвтэрлээ')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Алдаа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-[#E8F1FF] via-[#F5F9FF] to-[#E8F1FF] p-4">
      <div className="w-full max-w-md">
        <div className="relative overflow-hidden rounded-3xl bg-white border border-[#D6E4FF] shadow-premium-lg p-8">
          <div className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full bg-[#1677FF]/10 blur-2xl" />
          <div className="relative text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-[#1677FF] to-[#0B4DBA] shadow-premium-lg">
              <ShieldCheck className="size-7 text-white" />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold text-[#102A43]">Админ нэвтрэх</h1>
            <p className="mt-1 text-sm text-[#5B7290]">
              SOCIALTOOL.STORE удирдлагын самбар
            </p>
          </div>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#102A43] flex items-center gap-1">
                <User className="size-3.5" /> Нэвтрэх нэр
              </label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="mt-1 border-[#D6E4FF]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#102A43] flex items-center gap-1">
                <Lock className="size-3.5" /> Нууц үг
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="mt-1 border-[#D6E4FF]"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white shadow-premium-lg gap-2"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
              Нэвтрэх
            </Button>
          </form>

          <div className="mt-5 rounded-xl bg-[#F5F9FF] border border-[#D6E4FF] p-3 text-xs text-[#5B7290]">
            <p className="font-semibold text-[#0B4DBA]">Демо нэвтрэлт:</p>
            <p className="mt-0.5">Нэр: <code className="bg-white px-1.5 py-0.5 rounded">admin</code> · Нууц үг: <code className="bg-white px-1.5 py-0.5 rounded">admin123</code></p>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-[#5B7290]">
          © 2026 SOCIALTOOL.STORE · Админ панел
        </p>
      </div>
    </div>
  )
}
