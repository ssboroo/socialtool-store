'use client'
import { Minus, Plus } from 'lucide-react'

export function QuantityControl({ value, onChange, disabled = false }: { value: number; onChange: (value: number) => void; disabled?: boolean }) {
  return <div className="purchase-quantity" role="group" aria-label="Тоо ширхэг">
    <button type="button" aria-label="Тоо ширхэг багасгах" disabled={disabled || value <= 1} onClick={() => onChange(Math.max(1, value - 1))}><Minus className="size-4" /></button>
    <output aria-live="polite">{value}</output>
    <button type="button" aria-label="Тоо ширхэг нэмэх" disabled={disabled || value >= 99} onClick={() => onChange(Math.min(99, value + 1))}><Plus className="size-4" /></button>
  </div>
}
