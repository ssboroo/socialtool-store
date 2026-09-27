'use client'

import { Button } from '@/components/ui/button'
import { ProductImage } from './product-illustration'
import { useCartStore, useUIStore } from '@/store/cart'
import { formatTugrik } from '@/lib/format'
import { licenseVariants } from '@/lib/license'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { freeDownloadUrl } from '@/lib/free-download'
import { Download, Heart } from 'lucide-react'
import { useWishlist } from './wishlist-provider'
import { trackStoreEvent } from '@/lib/store-analytics'

export interface Product {
  id: string
  name: string
  slug: string
  shortDesc: string
  description: string
  price: number
  downloadUrl?: string | null
  requiresOrderLink?: boolean
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
  const wishlist = useWishlist()
  const isSaved = wishlist.savedIds.includes(product.id)
  const setSelectedProduct = useUIStore((s) => s.setSelectedProduct)
  const variants = licenseVariants(product.duration)
  const defaultVariant = variants[0]
  const downloadUrl = freeDownloadUrl(product)

  const handleAdd = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!product.available || product.price === 0) {
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
      requiresOrderLink: product.requiresOrderLink,
      duration: defaultVariant?.term,
    })
    trackStoreEvent('cart_add', { productId: product.id })
    toast.success(`${product.name} сагсанд нэмэгдлээ`)
  }

  const openDetail = () => setSelectedProduct(product.id)


  return <article className={cn('relative shop-product',compact&&'shop-product-compact',!product.available&&'shop-product-unavailable')}>
    <button type="button" className="absolute right-3 top-3 z-20 grid size-10 place-items-center rounded-full border border-[#D6E4FF] bg-white/95 text-[#1677FF] shadow-md transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-[#1677FF]" aria-label={isSaved ? 'Хүслийн жагсаалтаас хасах' : 'Хүслийн жагсаалтад хадгалах'} aria-pressed={isSaved} disabled={wishlist.busyId === product.id} onClick={() => void wishlist.toggle(product.id)}><Heart className={`size-[19px] ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} /></button>
    <button type="button" className="shop-product-art" onClick={openDetail} aria-label={product.name+' дэлгэрэнгүй'}>
      <ProductImage image={product.image} icon={product.icon} alt={product.name} category={product.category} mode={product.icon === "Custom" ? "image" : "icon"} className="aspect-[16/10] w-full"/>
    </button>
    <div className="shop-product-body">
      <h3><button type="button" onClick={openDetail}>{product.name}</button></h3>
      <p className="shop-product-summary">{product.shortDesc}</p>
      <div className="shop-product-price"><strong>{product.price===0?'Үнэгүй':formatTugrik(defaultVariant?.price??product.price)}</strong>{product.oldPrice?<del>{formatTugrik(product.oldPrice)}</del>:null}</div>
      {product.price===0 ? downloadUrl ? <Button asChild className="shop-product-buy"><a href={downloadUrl} target="_blank" rel="noopener noreferrer"><Download size={16}/>Үнэгүй татах<span className="sr-only"> — {product.name}, шинэ цонхонд</span></a></Button> : <Button disabled className="shop-product-buy">Татах боломжгүй</Button> : <Button onClick={handleAdd} disabled={!product.available} className="shop-product-buy">
        {product.available?(variants.length>1?'Сонголт хийх':'Сагсанд нэмэх'):'Түр дууссан'}
      </Button>}
    </div>
  </article>
}
