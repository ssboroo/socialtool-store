'use client'
import { useState } from 'react'
import {
  Facebook, Music2, Instagram, Twitter, Send, Mail, Sparkles, LayoutGrid, Package,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const MAP: Record<string, { Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; gradient: string; accent: string }> = {
  Facebook: { Icon: Facebook, gradient: 'from-[#E8F1FF] to-[#D6E4FF]', accent: '#1677FF' },
  Music2: { Icon: Music2, gradient: 'from-[#EEF4FF] to-[#D6E4FF]', accent: '#0B4DBA' },
  Instagram: { Icon: Instagram, gradient: 'from-[#FFE8F0] to-[#FFD6E8]', accent: '#E1306C' },
  Twitter: { Icon: Twitter, gradient: 'from-[#EEF4FF] to-[#D6E4FF]', accent: '#102A43' },
  Send: { Icon: Send, gradient: 'from-[#E8F1FF] to-[#D6E4FF]', accent: '#0B4DBA' },
  Mail: { Icon: Mail, gradient: 'from-[#E6F7EB] to-[#C7ECD2]', accent: '#16A34A' },
  Sparkles: { Icon: Sparkles, gradient: 'from-[#F0EAFF] to-[#E0D4FF]', accent: '#8B5CF6' },
  LayoutGrid: { Icon: LayoutGrid, gradient: 'from-[#E8F1FF] to-[#D6E4FF]', accent: '#1677FF' },
}

/** The abstract gradient + icon illustration used as the fallback image. */
export function ProductIllustration({
  icon,
  className,
}: {
  icon: string
  className?: string
}) {
  const meta = MAP[icon] || { Icon: Package, gradient: 'from-[#E8F1FF] to-[#D6E4FF]', accent: '#1677FF' }
  const { Icon } = meta
  return (
    <div className={cn('illustration-glass relative overflow-hidden rounded-xl bg-gradient-to-br', meta.gradient, className)}>
      <div className="absolute inset-0 opacity-[0.07]" style={{
        backgroundImage:
          'radial-gradient(circle at 20% 20%, ' + meta.accent + ' 0, transparent 35%), radial-gradient(circle at 80% 70%, ' + meta.accent + ' 0, transparent 30%)',
      }} />
      <div className="absolute -right-3 -top-3 size-16 rounded-full opacity-20" style={{ background: meta.accent }} />
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative">
          <div className="absolute inset-0 blur-xl opacity-30 rounded-full" style={{ background: meta.accent }} />
          <div className="illustration-icon relative grid size-16 place-items-center rounded-2xl bg-white/70 backdrop-blur border border-white shadow-premium">
            <Icon className="size-7" style={{ color: meta.accent }} />
          </div>
        </div>
      </div>
      {/* abstract dots */}
      <div className="absolute left-3 bottom-3 flex gap-1">
        <span className="size-1.5 rounded-full" style={{ background: meta.accent, opacity: 0.5 }} />
        <span className="size-1.5 rounded-full" style={{ background: meta.accent, opacity: 0.3 }} />
        <span className="size-1.5 rounded-full" style={{ background: meta.accent, opacity: 0.2 }} />
      </div>
    </div>
  )
}

/**
 * Product image: shows the uploaded image when present, falls back to the
 * abstract icon illustration otherwise. Both are rendered inside the same
 * rounded container so the card layout stays consistent.
 */
export function ProductImage({
  image,
  icon,
  alt,
  className,
}: {
  image?: string | null
  icon: string
  alt: string
  className?: string
}) {
  const [failedImage, setFailedImage] = useState<string | null>(null)
  if (image && failedImage !== image) {
    return (
      <div className={cn('relative overflow-hidden rounded-xl bg-[#F5F9FF]', className)}>
        { }
        <img
          src={image}
          onError={() => setFailedImage(image)}
          alt={alt}
          className="absolute inset-0 size-full object-cover"
          loading="lazy"
        />
      </div>
    )
  }
  return <ProductIllustration icon={icon} className={className} />
}
