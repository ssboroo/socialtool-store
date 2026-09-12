'use client'

import { useId } from 'react'
import { type LicenseTerm } from '@/lib/license'

export function LicenseSelector({
  value,
  onChange,
  options,
  compact = false,
}: {
  options: string[]
  value: LicenseTerm
  onChange: (value: LicenseTerm) => void
  compact?: boolean
}) {
  const name = useId()
  if (!options.length) return null

  return (
    <fieldset className={compact ? 'mt-2 min-w-0' : 'mt-4 min-w-0'} onClick={(e) => e.stopPropagation()}>
      {!compact && <legend className="mb-2 text-xs font-semibold leading-5 text-[#5B7290]">Эрхийн хугацаа</legend>}
      <div
        className={compact ? 'grid min-w-0 gap-1 rounded-[10px] bg-[#F0F5FB] p-1' : 'grid min-w-0 gap-1 rounded-xl bg-[#EEF4FF] p-1'}
        style={{ gridTemplateColumns: `repeat(${Math.min(options.length, 2)}, minmax(0, 1fr))` }}
      >
        {options.map((term) => (
          <label
            key={term}
            className={`${compact ? 'rounded-[8px] px-2 py-2 text-xs leading-4' : 'rounded-lg px-2 py-2 text-xs leading-4'} min-w-0 cursor-pointer text-center font-bold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500 ${value === term ? 'bg-white text-[#0B4DBA] shadow-sm ring-1 ring-[#C7DCFA]' : 'text-[#698099] hover:bg-white/70'}`}
          >
            <input type="radio" name={name} className="sr-only" checked={value === term} onChange={() => onChange(term)} aria-label={term} />
            <span className="block truncate" title={term}>{term}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
