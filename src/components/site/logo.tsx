'use client'
import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'
export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  const [failed, setFailed] = useState(false)
  return <div className={cn('flex min-w-0 items-center gap-2.5 sm:gap-3', className)}>
    <Image src={failed ? '/logo-fallback.png' : '/logo.svg'} alt={withText ? '' : 'Socialtool'} width={48} height={48} priority unoptimized onError={() => { if (!failed) setFailed(true) }} className="size-10 shrink-0 object-contain sm:size-12" />
    {withText && <div className="min-w-0 text-left leading-tight"><div className="whitespace-nowrap text-[15px] font-extrabold tracking-tight text-slate-900 sm:text-xl xl:text-[22px]">SOCIALTOOL.<span className="text-blue-600">STORE</span></div><div className="mt-0.5 whitespace-nowrap text-[9px] text-slate-500 sm:text-xs">Social media &amp; AI tools</div></div>}
  </div>
}
