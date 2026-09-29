import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { productShareUrl } from '@/lib/product-share'
import { externalShareImage } from '@/lib/share-link'
import { siteUrl } from '@/lib/site-url'
import { Logo } from '@/components/site/logo'
import { ProductImage } from '@/components/site/product-illustration'
import { ProductShare } from '@/components/site/product-share'
import { licenseVariants } from '@/lib/license'

export const dynamic = 'force-dynamic'
type Props = { params: Promise<{ id: string }> }
const getProduct = cache(async (id: string) => {
  const p = await db.product.findUnique({ where: { id }, select: { id: true, name: true, shortDesc: true, price: true, duration: true, image: true, available: true, category: true, icon: true, updatedAt: true } })
  if (!p || !p.available) notFound()
  return p
})
function origin() { return siteUrl() }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProduct((await params).id)
  const url = productShareUrl(p.id, origin())
  const remoteImage = externalShareImage(p.image)
  const image = remoteImage || `${url}/image?v=${p.updatedAt.getTime()}`
  return {
    title: p.name, description: p.shortDesc,
    alternates: { canonical: url },
    openGraph: { type: 'website', locale: 'mn_MN', title: p.name, description: p.shortDesc, url, siteName: 'SOCIALTOOL.STORE', images: [{ url: image, alt: p.name, ...(!remoteImage ? { width:1200, height:630, type:'image/png' } : {}) }] },
    twitter: { card: 'summary_large_image', title: p.name, description: p.shortDesc, images: [image] },
  }
}
export default async function SharedProduct({ params }: Props) {
  const p = await getProduct((await params).id)
  const variants = licenseVariants(p.duration)
  const money = (value: number) => value === 0 ? 'Үнэгүй' : value.toLocaleString('en-US') + ' ₮'
  return <main className="storefront-premium share-product-page">
    <a href="/" className="share-product-logo" aria-label="Нүүр хуудас"><Logo /></a>
    <article className="share-product-card">
      <ProductImage image={p.image} icon={p.icon} alt={p.name} className="share-product-image" />
      <div className="share-product-copy">
        <span className="catalog-eyebrow">{p.category}</span>
        <h1>{p.name}</h1><p>{p.shortDesc}</p>
        <div className="share-product-prices">{variants.length ? variants.map(v => <p key={v.term}>{v.term}: {money(v.price ?? p.price)}</p>) : money(p.price)}</div>
        <a href={'/?product=' + encodeURIComponent(p.id)} className="share-product-buy">Дэлгэрэнгүй үзэх / Захиалах</a>
        <ProductShare id={p.id} name={p.name} />
      </div>
    </article>
    <a href="/#products" className="share-product-back">← Бүх хэрэгсэл</a>
  </main>
}
