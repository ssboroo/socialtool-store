import { ShoppingBag, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="relative grid size-10 shrink-0 place-items-center rounded-[12px] bg-gradient-to-br from-[#1677FF] via-[#126BEE] to-[#0B4DBA] text-white shadow-[0_8px_24px_rgba(22,119,255,.28)] ring-1 ring-white/70">
        <ShoppingBag className="size-6 stroke-[2.2]" />
        <span className="absolute inset-0 grid place-items-center pt-1">
          <Zap className="size-3.5 fill-white stroke-white" />
        </span>
      </span>

      {withText && (
        <div className="flex min-w-0 flex-col leading-none">
          <span className="whitespace-nowrap text-[16px] font-black tracking-[-0.035em] text-[#102A43] sm:text-[17px]">
            SOCIALTOOL<span className="text-[#1677FF]">.STORE</span>
          </span>
          <span className="mt-1 whitespace-nowrap text-[9px] font-semibold tracking-[0.035em] text-[#7890AC]">
            DIGITAL TOOLS · SMARTER WORK
          </span>
        </div>
      )}
    </div>
  )
}
