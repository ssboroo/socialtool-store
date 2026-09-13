'use client'
import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'
export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  const [failed, setFailed] = useState(false)
  return <div className={cn('flex min-w-0 items-center gap-2.5 sm:gap-3', className)}>
    <Image src={failed ? '/logo-fallback.png' : '/logo.svg'} alt={withText ? '' : 'Socialtool'} width={48} height={48} priority unoptimized onError={() => { if (!failed) setFailed(true) }} className="size-10 shrink-0 object-contain sm:size-12" />
    {withText && <div className="min-w-0 text-left leading-tight"><div className="whitespace-nowrap text-[18px] font-bold tracking-[-0.065em] text-slate-900 sm:text-[25px] xl:text-[26px]" style={{ fontFamily: "'Avenir Next', 'Trebuchet MS', Arial, sans-serif" }}>socialtool<span className="text-blue-600">.store</span></div><div className="mt-0.5 whitespace-nowrap text-[9px] font-medium tracking-[0.045em] text-slate-500 sm:text-[10px]">Social media &amp; AI tools</div></div>}
  </div>
}
