'use client'

import { Heart, Loader2, ArrowRight, TrendingDown } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useWishlist } from './wishlist-provider'
import { useUIStore } from '@/store/cart'
import { useCustomer } from '@/hooks/use-customer'
import { formatTugrik } from '@/lib/format'
import { ProductImage } from './product-illustration'

export function WishlistDrawer() {
  const wishlist = useWishlist()
  const { customer } = useCustomer()
  const openAuth = useUIStore(s => s.openAuth)
  const openProduct = useUIStore(s => s.setSelectedProduct)
  return <Dialog open={wishlist.isOpen} onOpenChange={open => !open && wishlist.close()}>
    <DialogContent className="customer-surface max-h-[90vh] overflow-y-auto border-[#D6E4FF] bg-white sm:max-w-xl">
      <DialogTitle className="flex items-center gap-2 text-xl font-bold text-[#102A43]"><Heart className="size-5 text-[#1677FF]" /> Хүслийн жагсаалт</DialogTitle>
      <DialogDescription>Хадгалсан бүтээгдэхүүнүүд болон үнэ буурсан эсэхийг эндээс харна.</DialogDescription>
      {!customer ? <div className="rounded-2xl bg-[#F5F9FF] p-7 text-center">
        <p className="mb-4 text-[#5B7290]">Нэвтрээд сонирхсон бараагаа аль ч төхөөрөмжөөс харна уу.</p>
        <Button onClick={() => { wishlist.close(); openAuth('login') }}>Нэвтрэх</Button>
      </div> : wishlist.loading ? <div className="grid place-items-center py-12"><Loader2 className="animate-spin" /></div>
      : !wishlist.items.length ? <div className="grid place-items-center gap-3 rounded-2xl bg-[#F5F9FF] py-12 text-[#5B7290]">
        <Heart className="size-10 opacity-40" /><p>Одоогоор хадгалсан бараа байхгүй.</p>
        <Button variant="outline" onClick={wishlist.close}>Бүтээгдэхүүн үзэх</Button>
      </div> : <div className="space-y-3">
        {wishlist.items.map(row => <div key={row.id} className="flex gap-3 rounded-2xl border border-[#D6E4FF] bg-[#F7FAFF] p-3">
          <ProductImage image={row.product.image} icon={row.product.icon} alt={row.product.name} category={row.product.category} className="size-20 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 font-bold text-[#102A43]">{row.product.name}</p>
            <p className="text-xs text-[#5B7290]">{row.product.category}</p>
            <strong className="mt-1 block text-[#1677FF]">{formatTugrik(row.product.price)}</strong>
            {row.priceDropped && <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700"><TrendingDown className="size-3.5" /> Үнэ буурсан · {formatTugrik(row.savedPrice)}</span>}
            {!row.product.available && <p className="text-xs text-orange-700">Түр дууссан</p>}
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => { wishlist.close(); openProduct(row.product.id) }}>Дэлгэрэнгүй <ArrowRight className="size-3.5" /></Button>
              <Button size="sm" variant="outline" disabled={wishlist.busyId === row.product.id} onClick={() => void wishlist.toggle(row.product.id)}>Хасах</Button>
            </div>
          </div>
        </div>)}
      </div>}
    </DialogContent>
  </Dialog>
}
