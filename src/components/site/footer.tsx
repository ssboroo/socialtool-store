'use client'

import { useState } from 'react'
import { ArrowUp, Mail, Send, ShieldCheck, Zap } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { ProductDescription } from './product-description'
import { Logo } from './logo'

export function Footer({ settings }: { settings?: Record<string, string> }) {
  const [policy, setPolicy] = useState<string | null>(null)
  const email = settings?.contactEmail || 'help@socialtool.store'
  const telegram = (settings?.contactTelegram || 'socialtool').replace(/^@/, '')
  function navigate(id: string) { document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' }) }
  return <>
    <footer className="store-full-footer store-container">
      <div className="store-footer-grid">
        <div className="store-footer-about"><Logo /><p>Сошиал медиа, AI болон бүтээмжийн хэрэгслүүд. Таны дижитал ажилд илүү их боломж.</p><div className="store-footer-badges"><span><ShieldCheck size={15} /> QPay төлбөр</span><span><Zap size={15} /> Дижитал хүргэлт</span></div></div>
        <nav aria-label="Дэлгүүрийн холбоос"><h3>Дэлгүүр</h3><button onClick={() => navigate('#products')}>Бүх бүтээгдэхүүн</button><button onClick={() => navigate('#categories')}>Ангиллууд</button><button onClick={() => navigate('#benefits')}>Бидний давуу тал</button><button onClick={() => navigate('#reviews')}>Хэрэглэгчдийн сэтгэгдэл</button></nav>
        <nav aria-label="Тусламжийн холбоос"><h3>Тусламж</h3><button onClick={() => navigate('#how')}>Хэрхэн захиалах вэ?</button><button onClick={() => navigate('#faq')}>Түгээмэл асуулт</button><button onClick={() => setPolicy('termsOfService')}>Үйлчилгээний нөхцөл</button><button onClick={() => setPolicy('privacyPolicy')}>Нууцлалын бодлого</button></nav>
        <div className="store-footer-reach"><h3>Холбоо барих</h3><a href={`mailto:${email}`}><Mail size={16} />{email}</a><a href={`https://t.me/${telegram}`} target="_blank" rel="noopener noreferrer"><Send size={16} />@{telegram}</a><button onClick={() => window.dispatchEvent(new Event('st-open-chat'))}>Админтай чатлах ↗</button></div>
      </div>
      <div className="store-footer-bottom"><span>© {new Date().getFullYear()} SOCIALTOOL.STORE. Бүх эрх хуулиар хамгаалагдсан.</span><button onClick={() => navigate('#top')}>Дээш очих <ArrowUp size={14} /></button></div>
    </footer>
    <Dialog open={!!policy} onOpenChange={open => { if (!open) setPolicy(null) }}><DialogContent className="store-dialog max-h-[85vh] overflow-y-auto sm:max-w-2xl"><DialogTitle>{policy === 'privacyPolicy' ? 'Нууцлалын бодлого' : 'Үйлчилгээний нөхцөл'}</DialogTitle><ProductDescription text={settings?.[policy || ''] || 'Мэдээлэл хараахан нийтлэгдээгүй байна. Админтай холбогдоно уу.'} /></DialogContent></Dialog>
  </>
}
