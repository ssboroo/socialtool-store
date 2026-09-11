'use client'
import { useState } from 'react'

export function QuantityInput({ value, onChange, label }: { value: number; onChange: (value: number) => void; label: string }) {
  // Remount the draft editor whenever the controlled value changes instead of mirroring props in an effect.
  return <QuantityDraft key={value} value={value} onChange={onChange} label={label} />
}

function QuantityDraft({ value, onChange, label }: { value: number; onChange: (value: number) => void; label: string }) {
  const [draft, setDraft] = useState(String(value))

  function commit() {
    const parsed = Number(draft)
    const next = /^\d+$/.test(draft) && Number.isSafeInteger(parsed)
      ? Math.max(1, Math.min(99, parsed))
      : value
    setDraft(String(next))
    if (next !== value) onChange(next)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      aria-label={label}
      title="1–99 ширхэг"
      value={draft}
      onChange={(e) => {
        if (/^\d{0,2}$/.test(e.target.value)) setDraft(e.target.value)
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') {
          setDraft(String(value))
          e.currentTarget.blur()
        }
      }}
      className="h-8 w-12 border-x border-[#D6E4FF] bg-white text-center text-sm font-bold text-[#102A43] focus:outline-blue-500"
    />
  )
}
