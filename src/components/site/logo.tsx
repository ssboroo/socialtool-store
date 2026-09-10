import { ShoppingBag, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="relative grid size-9 shrink-0 place-items-center rounded-[9px] bg-gradient-to-b from-[#2386FF] to-[#0968E5] text-white shadow-[0_7px_18px_rgba(22,119,255,.25)] ring-1 ring-[#0B67DA]/10">
        <ShoppingBag className="size-[22px] stroke-[2.2]" />
        <Zap className="absolute size-[11px] fill-white stroke-white" />
      </span>
      {withText && (
        <span className="whitespace-nowrap text-[16px] font-black leading-none tracking-[-0.04em] text-[#102A43] sm:text-[17px]">
          SOCIALTOOL<span className="text-[#1677FF]">.STORE</span>
        </span>
      )}
    </div>
  )
}
