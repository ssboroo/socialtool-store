'use client'

import { useEffect, useState } from 'react'
import { Loader2, Save, Settings, FileText, Gift, Phone, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

const FIELDS: { key: string; label: string; group: string; icon: React.ComponentType<{ className?: string }>; multiline?: boolean }[] = [
  { key: 'privacyPolicy', label: 'Нууцлалын бодлого', group: 'Бодлого', icon: FileText, multiline: true },
  { key: 'termsOfService', label: 'Үйлчилгээний нөхцөл', group: 'Бодлого', icon: FileText, multiline: true },
  { key: 'heroHeadline', label: 'Hero гол гарчиг', group: 'Нүүр хуудас', icon: FileText },
  { key: 'heroSubtext', label: 'Hero дэд гарчиг', group: 'Нүүр хуудас', icon: FileText, multiline: true },
  { key: 'heroPrimaryCta', label: 'Үндсэн товчийн текст', group: 'Нүүр хуудас', icon: FileText },
  { key: 'heroSecondaryCta', label: 'Хоёрдогч товчийн текст', group: 'Нүүр хуудас', icon: FileText },
  { key: 'promoTitle', label: 'Хямдралын гарчиг', group: 'Хямдрал', icon: Gift },
  { key: 'promoDescription', label: 'Хямдралын тайлбар', group: 'Хямдрал', icon: Gift, multiline: true },
  { key: 'promoCta', label: 'Хямдралын товч', group: 'Хямдрал', icon: Gift },
  { key: 'promoDiscountPercent', label: 'Хямдралын хувь (%)', group: 'Хямдрал', icon: Gift },
  { key: 'contactEmail', label: 'Холбооны и-мэйл', group: 'Холбоо', icon: Mail },
  { key: 'contactTelegram', label: 'Telegram хаяг', group: 'Холбоо', icon: Phone },
  { key: 'footerDescription', label: 'Футерын тайлбар', group: 'Футер', icon: FileText, multiline: true },
  { key: 'footerCopyright', label: 'Зохиогчийн эрх', group: 'Футер', icon: FileText },
]

export function AdminSettings({ token }: { token: string }) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [checking, setChecking] = useState(false)
  const [checks, setChecks] = useState<{name: string; ok: boolean; detail: string}[]>([])
  const checkConnections = async () => {
    setChecking(true)
    try {
      const res = await fetch('/api/admin/integrations', { headers: { authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Шалгаж чадсангүй')
      setChecks(data.checks)
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Шалгаж чадсангүй') }
    finally { setChecking(false) }
  }

  useEffect(() => {
    fetch('/api/admin/settings', { headers: { authorization: `Bearer ${token}` } })
      .then(async r => { if (!r.ok) throw new Error('Тохиргоо ачаалсангүй'); return r.json() })
      .then((d) => { if (d && typeof d === 'object') setValues(d as Record<string, string>) })
      .catch(() => { setLoadFailed(true); toast.error('Тохиргоо ачаалсангүй. Хуудсаа шинэчилнэ үү.') })
      .finally(() => setLoading(false))
  }, [token])

  const uploadPoster = async (file?: File) => {
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/admin/products/upload', { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Зураг хадгалагдсангүй')
      setValues(v => ({ ...v, heroImage: data.url }))
      toast.success('Зураг орууллаа. Хадгалах товчийг дарж нүүрэнд байрлуулна.')
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Зураг оруулахад алдаа гарлаа') }
    finally { setUploading(false) }
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Тохиргоо хадгалагдлаа')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Алдаа')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="size-7 animate-spin text-[#1677FF]" /></div>

  const groups = Array.from(new Set(FIELDS.map((f) => f.group)))

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="rounded-2xl bg-gradient-to-r from-[#E8F1FF] to-white border border-[#D6E4FF] p-4 flex items-start gap-3">
        <Settings className="size-5 text-[#1677FF] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-[#102A43]">Сайтын агуулга, бичвэрүүд</p>
          <p className="text-xs text-[#5B7290] mt-0.5">Эдгээр тохиргоог өөрчилснөөр нүүр хуудас, футер, хямдралын баннер шууд шинэчлэгдэнэ.</p>
        </div>
      </div>

      <section className="rounded-2xl border border-[#D6E4FF] bg-white p-5 space-y-3">
        <h3 className="font-bold text-[#102A43]">Төлбөр, Telegram, бүртгэлийн холболт</h3>
        <p className="text-sm text-[#5B7290]">Нууц түлхүүрүүдийг серверийн Variables хэсэгт тохируулна. Энэ шалгалт мөнгө шилжүүлэхгүй, Telegram мэдэгдэл илгээхгүй.</p>
        <Button type="button" onClick={checkConnections} disabled={checking}>{checking ? 'Шалгаж байна…' : 'Холболт шалгах'}</Button>
        <div aria-live="polite" className="space-y-3">{checks.map(c => <div key={c.name} className="rounded-lg bg-[#F5F9FF] p-3"><p className={c.ok ? 'font-semibold text-green-700' : 'font-semibold text-amber-700'}>{c.ok ? '✓' : '!'} {c.name}</p><p className="text-sm text-[#5B7290] mt-1 break-words">{c.detail}</p></div>)}</div>
      </section>

      <section className="space-y-3 rounded-2xl border border-[#D6E4FF] bg-white p-5">
        <h3 className="font-bold text-[#102A43]">Нүүрний постерын зураг</h3>
        <p className="text-sm text-[#5B7290]">Зураг сонговол SOCIALTOOL постерын оронд хөдөлгөөнтэй харагдана. JPEG, PNG, WebP, GIF · 5MB хүртэл.</p>
        {values.heroImage && <img src={values.heroImage} alt="Нүүрний постерын урьдчилсан харагдац" className="max-h-80 w-full rounded-xl object-contain bg-blue-50" />}
        <label className="block text-sm font-semibold">Зураг сонгох<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading || loadFailed} onChange={e => { void uploadPoster(e.target.files?.[0]); e.target.value = '' }} className="mt-2 block w-full text-sm" /></label>
        {uploading && <p role="status">Зураг хадгалж байна…</p>}
        {values.heroImage && <Button type="button" variant="outline" disabled={uploading} onClick={() => setValues(v => ({ ...v, heroImage: '' }))}>Үндсэн постер харуулах</Button>}
      </section>

      {groups.map((g) => (
        <div key={g} className="rounded-2xl bg-white border border-[#D6E4FF] shadow-premium p-5">
          <h3 className="text-sm font-bold text-[#102A43] uppercase tracking-wide mb-4 flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-lg bg-[#E8F1FF] text-[#0B4DBA] text-[10px]">{g[0]}</span>
            {g}
          </h3>
          <div className="space-y-4">
            {FIELDS.filter((f) => f.group === g).map((f) => {
              const { icon: Icon } = f
              return (
                <div key={f.key}>
                  <Label className="text-xs font-semibold text-[#102A43] flex items-center gap-1.5">
                    <Icon className="size-3.5" /> {f.label}
                  </Label>
                  {f.multiline ? (
                    <textarea
                      value={values[f.key] || ''}
                      onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                      rows={2}
                      className="mt-1 w-full rounded-md border border-[#D6E4FF] bg-white px-3 py-2 text-sm text-[#102A43] focus:border-[#1677FF] focus:outline-none focus:ring-2 focus:ring-[#1677FF]/10 custom-scroll"
                    />
                  ) : (
                    <Input
                      value={values[f.key] || ''}
                      onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                      className="mt-1 border-[#D6E4FF]"
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <div className="sticky bottom-4 flex justify-end">
        <Button onClick={save} disabled={saving || uploading || loadFailed} className="h-12 px-6 rounded-xl bg-gradient-to-r from-[#1677FF] to-[#0B4DBA] text-white shadow-premium-lg gap-2">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Хадгалах
        </Button>
      </div>
    </div>
  )
}
