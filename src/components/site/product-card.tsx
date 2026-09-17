'use client'

import { Star, ShoppingCart, Clock, PlayCircle, CircleOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductImage } from './product-illustration'
import { useCartStore, useUIStore } from '@/store/cart'
import { formatTugrik } from '@/lib/format'
import { getYouTubeId } from '@/lib/media'
import { licenseVariants } from '@/lib/license'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export interface Product {
  id: string
  name: string
  slug: string
  shortDesc: string
  description: string
  price: number
  oldPrice: number | null
  discount: number | null
  icon: string
  image?: string | null
  category: string
  rating: number
  reviewCount: number
  available: boolean
  features?: string | null
  duration?: string | null
  tutorialVideoUrl?: string | null
  instructionImages?: string | null
}

export function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const add = useCartStore((s) => s.add)
  const setSelectedProduct = useUIStore((s) => s.setSelectedProduct)
  const variants = licenseVariants(product.duration)
  const defaultVariant = variants[0]
  const durationLabel = variants.length > 0 ? variants.map((v) => v.term).join(' · ') : ''

  const handleAdd = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!product.available) {
      toast.error('Энэ бүтээгдэхүүн түр дууссан байна')
      return
    }

    if (variants.length > 1) { setSelectedProduct(product.id); return }
    const price = defaultVariant?.price ?? product.price
    add({
      id: product.id,
      name: product.name,
      price,
      icon: product.icon,
      category: product.category,
      duration: defaultVariant?.term,
    })
    toast.success(`${product.name} сагсанд нэмэгдлээ`)
  }

  const openDetail = () => setSelectedProduct(product.id)


  return <article className={cn('shop-product',compact&&'shop-product-compact',!product.available&&'shop-product-unavailable')}>
    <button type="button" className="shop-product-art" onClick={openDetail} aria-label={product.name+' дэлгэрэнгүй'}>
      <ProductImage image={product.image} icon={product.icon} alt={product.name} className="aspect-[4/3] w-full"/>
      <span className="shop-product-badge">{product.category}</span>
      {product.discount ? <span className="shop-discount">−{product.discount}%</span>:null}
      {product.tutorialVideoUrl&&getYouTubeId(product.tutorialVideoUrl)?<span className="shop-video"><PlayCircle className="size-3.5"/>Заавар видео</span>:null}
    </button>
    <div className="shop-product-body">
      <h3><button type="button" onClick={openDetail}>{product.name}</button></h3>
      <p className="shop-product-summary">{product.shortDesc}</p>
      <div className="shop-product-meta">
        <span className="shop-product-category">{product.category}</span>
        {durationLabel&&<span><Clock className="size-4"/>{durationLabel}</span>}
        {!product.available&&<span>Түр дууссан</span>}
      </div>
      <div className="shop-product-price"><strong>{formatTugrik(defaultVariant?.price??product.price)}</strong>{product.oldPrice?<del>{formatTugrik(product.oldPrice)}</del>:null}{product.reviewCount>0&&<span className="shop-product-rating"><Star className="size-3.5 fill-amber-400 text-amber-400"/>{product.rating.toFixed(1)} ({product.reviewCount})</span>}</div>
      <Button onClick={handleAdd} disabled={!product.available} className="shop-product-buy">
        {product.available?<ShoppingCart className="size-4"/>:<CircleOff className="size-4"/>}
        {product.available?(variants.length>1?'Сонголт хийх':'Сагсанд нэмэх'):'Түр дууссан'}
      </Button>
    </div>
  </article>
}
