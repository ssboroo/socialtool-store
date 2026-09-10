'use client'
import { useEffect, useState } from 'react'
export function QuantityInput({ value, onChange, label }: { value: number; onChange: (value: number) => void; label: string }) {
  const [draft, setDraft] = useState(String(value))
  useEffect(() => setDraft(String(value)), [value])
  function commit() {
    const parsed = Number(draft)
    const next = /^\d+$/.test(draft) && Number.isSafeInteger(parsed) ? Math.max(1, Math.min(99, parsed)) : value
    setDraft(String(next)); onChange(next)
  }
  return <input type="text" inputMode="numeric" pattern="[0-9]*" aria-label={label} title="1–99 ширхэг" value={draft} onChange={e => { if (/^\d{0,3}$/.test(e.target.value)) setDraft(e.target.value) }} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }} className="h-8 w-12 border-x border-[#D6E4FF] bg-white text-center text-sm font-bold text-[#102A43] focus:outline-blue-500" />
}
