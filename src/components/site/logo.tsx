import { cn } from '@/lib/utils'

export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="relative">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#1677FF] to-[#0B4DBA] blur-[6px] opacity-40" />
        <div className="relative grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#1677FF] to-[#0B4DBA] shadow-premium">
          <svg viewBox="0 0 24 24" className="size-5 text-white" fill="none">
            <path
              d="M12 2.5 3 7v6c0 4.5 3.5 8 9 9 5.5-1 9-4.5 9-9V7l-9-4.5Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M8.5 12.2 11 14.7l4.5-4.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
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
