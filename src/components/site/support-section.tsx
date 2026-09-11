'use client'

import { ArrowUpRight, Headphones, MessageCircle, Send } from 'lucide-react'

export function SupportSection({ settings }: { settings: Record<string, string> }) {
  const telegram = (settings.contactTelegram || 'socialtool').replace(/^@/, '')
  return (
    <section id="contact" className="store-section store-support">
      <div className="store-container store-support-surface">
        <div className="store-support-art" aria-hidden="true"><Headphones /><span>Танд туслахад бэлэн</span></div>
        <div className="store-support-copy">
          <span className="store-section-kicker">ХАМТДАА ШИЙДЬЕ</span>
          <h2>Танд тохирох хэрэгслийг<br />хамтдаа сонгоё.</h2>
          <p>Сонголт, идэвхжүүлэлт, захиалгын талаар асуух зүйл байна уу? Бидэнтэй шууд холбогдоорой.</p>
          <div className="store-support-actions">
            <button className="store-primary" onClick={() => window.dispatchEvent(new Event('st-open-chat'))}><MessageCircle size={18} /> Чатаар асуух <ArrowUpRight size={17} /></button>
            <a href={`https://t.me/${telegram}`} target="_blank" rel="noopener noreferrer"><Send size={18} /> Telegram</a>
          </div>
        </div>
      </div>
    </section>
  )
}
