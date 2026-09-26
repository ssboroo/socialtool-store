import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { db } from '@/lib/db'
import { productShareUrl, publicProductImage } from '@/lib/product-share'
import { licenseVariants } from '@/lib/license'

export const dynamic = 'force-dynamic'
type Props = { params: Promise<{ id: string }> }
const getProduct = cache(async (id: string) => {
  const p = await db.product.findUnique({ where: { id }, select: { id: true, name: true, shortDesc: true, price: true, duration: true, image: true, available: true } })
  if (!p || !p.available) notFound()
  return p
})
function origin() { return process.env.NEXT_PUBLIC_SITE_URL || 'https://socialtool.store' }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProduct((await params).id)
  const image = publicProductImage(p.image, origin())
  const url = productShareUrl(p.id, origin())
  return {
    title: p.name + ' | SOCIALTOOL.STORE', description: p.shortDesc,
    alternates: { canonical: url },
    openGraph: { type: 'website', title: p.name, description: p.shortDesc, url, siteName: 'SOCIALTOOL.STORE', images: image ? [{ url: image, alt: p.name }] : [] },
    twitter: { card: image ? 'summary_large_image' : 'summary', title: p.name, description: p.shortDesc, images: image ? [image] : [] },
  }
}
export default async function SharedProduct({ params }: Props) {
  const p = await getProduct((await params).id)
  const image = publicProductImage(p.image, origin())
  const variants = licenseVariants(p.duration)
  const money = (value: number) => value === 0 ? 'Үнэгүй' : value.toLocaleString('en-US') + ' ₮'
  return <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-5 px-5 py-10">
    <a href="/" className="font-bold text-blue-600">SOCIALTOOL.STORE</a>
    {image && <Image src={image} alt={p.name} width={640} height={480} unoptimized className="max-h-80 w-full rounded-2xl object-contain" />}
    <h1 className="break-words text-3xl font-bold">{p.name}</h1>
    <p className="whitespace-pre-wrap break-words">{p.shortDesc}</p>
    <div className="space-y-2 text-xl font-bold">{variants.length ? variants.map(v => <p key={v.term}>{v.term}: {money(v.price ?? p.price)}</p>) : money(p.price)}</div>
    <a href={'/?product=' + encodeURIComponent(p.id)} className="rounded-xl bg-blue-600 px-5 py-4 text-center font-bold text-white">Дэлгэрэнгүй үзэх / Захиалах</a>
  </main>
}
