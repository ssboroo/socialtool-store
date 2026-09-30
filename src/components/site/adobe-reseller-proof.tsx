'use client'

import { BadgeCheck, CalendarDays, ExternalLink, ShieldCheck, X } from 'lucide-react'

export function AdobeResellerProof({ compact = false, onClose }: { compact?: boolean; onClose?: () => void }) {
  return (
    <section className={compact ? 'adobe-proof adobe-proof-compact' : 'adobe-proof'} aria-label="Adobe Partner Connection reseller membership">
      <div className="adobe-proof-card">
        <div className="adobe-proof-main">
          <div className="adobe-proof-badge">
            <BadgeCheck className="size-4" />
            Adobe Partner Connection
          </div>
          <div className="adobe-proof-title-row">
            <div>
              <p className="adobe-proof-kicker">Албан ёсны reseller membership</p>
              <h2>Socialtool — Adobe Reseller</h2>
            </div>
            {onClose ? <button type="button" className="adobe-proof-close" onClick={onClose} aria-label="Хаах"><X className="size-4"/></button> : null}
          </div>
          <p className="adobe-proof-copy">
            Socialtool нь Adobe Partner Connection Reseller Program-д идэвхтэй бүртгэлтэй. Adobe бүтээгдэхүүний SKU, үнэ болон лицензийн нөхцөл нь зөвшөөрөгдсөн түгээлтийн сувгаар баталгаажсаны дараа худалдаанд идэвхжинэ.
          </p>
          <a className="adobe-proof-link" href="https://partners.adobe.com/apac/channelpartners/" target="_blank" rel="noreferrer">
            Adobe Partner Connection-ийн албан ёсны мэдээлэл <ExternalLink className="size-4"/>
          </a>
        </div>

        <div className="adobe-proof-meta">
          <div><ShieldCheck className="size-5"/><span><small>Membership type</small><strong>Reseller</strong></span></div>
          <div><BadgeCheck className="size-5"/><span><small>Status</small><strong>Active</strong></span></div>
          <div><CalendarDays className="size-5"/><span><small>Membership expiration</small><strong>2027-09-30</strong></span></div>
        </div>
      </div>
    </section>
  )
}
