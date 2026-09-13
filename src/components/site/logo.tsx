'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-transparent sm:size-11">
        <Image
          src="/socialtool-logo.png"
          alt="SOCIALTOOL.STORE"
          width={512}
          height={512}
          priority
          unoptimized
          className="size-full object-contain"
        />
      </div>
      {withText && (
        <div className="flex flex-col leading-none">
          <span className="text-[15px] font-extrabold tracking-tight text-[#102A43]">
            SOCIALTOOL<span className="text-[#1677FF]">.STORE</span>
          </span>
          <span className="mt-0.5 text-[10px] font-medium tracking-wide text-[#5B7290]">
            Social media &amp; AI tools
          </span>
        </div>
      )}
    </div>
  )
}
