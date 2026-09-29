'use client'

import { Copy, Facebook } from 'lucide-react'
import { toast } from 'sonner'
import { facebookShareUrl, productPath } from '@/lib/share-link'
import { siteUrl } from '@/lib/site-url'

export function ProductShare({ id, name, compact = false }: { id: string; name: string; compact?: boolean }) {
  const url = siteUrl() + productPath(id)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Бүтээгдэхүүний холбоос хуулагдлаа')
    } catch {
      toast.error('Холбоос хуулж чадсангүй. Бүтээгдэхүүний хуудсыг нээгээд хаягийг хуулна уу.')
    }
  }
  return <div className="product-share" aria-label={`${name} хуваалцах`}>
    <a className="product-share-facebook" href={facebookShareUrl(url)} target="_blank" rel="noopener noreferrer" aria-label={`${name} Facebook-д хуваалцах (шинэ цонх)`}>
      <Facebook size={16} aria-hidden="true" /><span>{compact ? 'Share' : 'Facebook-д хуваалцах'}</span>
    </a>
    {!compact && <><button type="button" onClick={copy}><Copy size={15} aria-hidden="true" />Холбоос хуулах</button><a className="product-share-permalink" href={productPath(id)}>Барааны холбоос</a></>}
  </div>
}
