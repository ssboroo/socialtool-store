'use client'

import { Button } from '@/components/ui/button'
import { ProductImage } from './product-illustration'
import { useCartStore, useUIStore } from '@/store/cart'
import { formatTugrik } from '@/lib/format'
import { licenseVariants } from '@/lib/license'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { freeDownloadUrl } from '@/lib/free-download'
import { Download } from 'lucide-react'

export interface Product {
  id: string
  name: string
  slug: string
  shortDesc: string
  description: string
  price: number
  downloadUrl?: string | null
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
      duration: defaultVariant?.term,
    })
    toast.success(`${product.name} сагсанд нэмэгдлээ`)
  }

  const openDetail = () => setSelectedProduct(product.id)


  return <article className={cn('shop-product',compact&&'shop-product-compact',!product.available&&'shop-product-unavailable')}>
    <button type="button" className="shop-product-art" onClick={openDetail} aria-label={product.name+' дэлгэрэнгүй'}>
      <ProductImage image={product.image} icon={product.icon} alt={product.name} category={product.category} mode="icon" className="aspect-[16/10] w-full"/>
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
