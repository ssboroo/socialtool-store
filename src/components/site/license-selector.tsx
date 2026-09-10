 'use client'
import { useId } from 'react'
import { LICENSE_TERMS, type LicenseTerm } from '@/lib/license'
export function LicenseSelector({ value, onChange }: { value: LicenseTerm; onChange: (value: LicenseTerm) => void }) {
  const name = useId()
  return <fieldset className="mt-4 min-w-0" onClick={e => e.stopPropagation()}>
    <legend className="mb-2 text-xs font-semibold text-[#5B7290]">Эрхийн хугацаа</legend>
    <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#EEF4FF] p-1">
      {LICENSE_TERMS.map(term => <label key={term} className={`cursor-pointer rounded-lg px-2 py-2 text-center text-xs font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500 ${value === term ? 'bg-white text-[#0B4DBA] shadow-sm' : 'text-[#5B7290] hover:bg-white/60'}`}>
        <input type="radio" name={name} className="sr-only" checked={value === term} onChange={() => onChange(term)} aria-label={term} />{term}
      </label>)}
    </div>
  </fieldset>
}
