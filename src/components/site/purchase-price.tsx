import { formatTugrik } from '@/lib/format'

export function PurchasePrice({ amount, className = '' }: { amount: number; className?: string }) {
  return <span className={`purchase-price ${className}`}>{amount === 0 ? 'Үнэгүй' : formatTugrik(amount)}</span>
}
