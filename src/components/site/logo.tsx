'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  const [src, setSrc] = useState('/socialtool-logo-s.png')

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-[#1677FF] to-[#0B4DBA] shadow-sm ring-1 ring-[#D6E4FF]">
        <span className="absolute text-sm font-black text-white">S</span>
        <Image
          src={src}
          alt="SOCIALTOOL.STORE"
          width={36}
          height={36}
          priority
          unoptimized
          onError={() => setSrc('/logo.svg')}
          className="relative z-10 size-9 object-contain"
        />
      </div>
      {withText && (
        <div className="flex flex-col leading-none">
          <span className="text-[15px] font-bold tracking-tight text-[#102A43]">
            SOCIALTOOL<span className="text-[#1677FF]">.STORE</span>
          </span>
          <span className="text-[10px] font-medium text-[#5B7290] tracking-wide">
            Social media &amp; AI tools
          </span>
        </div>
      )}
    </div>
  )
}
