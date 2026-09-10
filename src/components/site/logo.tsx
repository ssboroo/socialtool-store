import Image from 'next/image'
import { cn } from '@/lib/utils'

export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <Image
        src="/socialtool-logo-s.png"
        alt={withText ? '' : 'SOCIALTOOL.STORE лого'}
        width={40}
        height={43}
        sizes="44px"
        className="size-11 shrink-0 object-contain"
      />
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
