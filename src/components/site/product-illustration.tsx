'use client'

import { useState, type ComponentType, type SVGProps } from 'react'
import {
  Facebook, Music2, Instagram, Twitter, Send, Mail, Sparkles, LayoutGrid, Package,
} from 'lucide-react'
import { suggestProductImage } from '@/lib/product-image-suggestions'
import { cn } from '@/lib/utils'

const MAP: Record<string, { Icon: ComponentType<SVGProps<SVGSVGElement>>; gradient: string; accent: string }> = {
  Facebook: { Icon: Facebook, gradient: 'from-[#E8F1FF] to-[#D6E4FF]', accent: '#1677FF' },
  Music2: { Icon: Music2, gradient: 'from-[#EEF4FF] to-[#D6E4FF]', accent: '#0B4DBA' },
  Instagram: { Icon: Instagram, gradient: 'from-[#FFE8F0] to-[#FFD6E8]', accent: '#E1306C' },
  Twitter: { Icon: Twitter, gradient: 'from-[#EEF4FF] to-[#D6E4FF]', accent: '#102A43' },
  Send: { Icon: Send, gradient: 'from-[#E8F1FF] to-[#D6E4FF]', accent: '#0B4DBA' },
  Mail: { Icon: Mail, gradient: 'from-[#E6F7EB] to-[#C7ECD2]', accent: '#16A34A' },
  Sparkles: { Icon: Sparkles, gradient: 'from-[#F0EAFF] to-[#E0D4FF]', accent: '#8B5CF6' },
  LayoutGrid: { Icon: LayoutGrid, gradient: 'from-[#E8F1FF] to-[#D6E4FF]', accent: '#1677FF' },
}

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
    <div className={cn('relative overflow-hidden rounded-xl bg-gradient-to-br', meta.gradient, className)}>
      <div className="absolute inset-0 opacity-[0.07]" style={{
        backgroundImage:
          'radial-gradient(circle at 20% 20%, ' + meta.accent + ' 0, transparent 35%), radial-gradient(circle at 80% 70%, ' + meta.accent + ' 0, transparent 30%)',
      }} />
      <div className="absolute -right-3 -top-3 size-16 rounded-full opacity-20" style={{ background: meta.accent }} />
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative">
          <div className="absolute inset-0 blur-xl opacity-30 rounded-full" style={{ background: meta.accent }} />
          <div className="relative grid size-14 place-items-center rounded-2xl bg-white/70 backdrop-blur border border-white shadow-premium">
            <Icon className="size-7" style={{ color: meta.accent }} />
          </div>
        </div>
      </div>
      <div className="absolute left-3 bottom-3 flex gap-1">
        <span className="size-1.5 rounded-full" style={{ background: meta.accent, opacity: 0.5 }} />
        <span className="size-1.5 rounded-full" style={{ background: meta.accent, opacity: 0.3 }} />
        <span className="size-1.5 rounded-full" style={{ background: meta.accent, opacity: 0.2 }} />
      </div>
    </div>
  )
}

function retryUrl(src: string, attempt: number) {
  if (!attempt || !src.startsWith('/uploads/products/')) return src
  const separator = src.includes('?') ? '&' : '?'
  return `${src}${separator}st_retry=${attempt}`
}

function ResilientProductImage({
  image,
  icon,
  alt,
  className,
}: {
  image: string
  icon: string
  alt: string
  className?: string
}) {
  const [attempt, setAttempt] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const retryable = image.startsWith('/uploads/products/')

  return (
    <div className={cn('relative overflow-hidden rounded-xl bg-[#F5F9FF]', className)}>
      <ProductIllustration icon={icon} className="absolute inset-0 size-full rounded-none" />
      {!failed && (
        <img
          key={`${image}-${attempt}`}
          src={retryUrl(image, attempt)}
          alt={alt}
          className={cn(
            'absolute inset-0 size-full object-cover transition-opacity duration-200',
            loaded ? 'opacity-100' : 'opacity-0',
          )}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => {
            setLoaded(false)
            if (retryable && attempt < 2) setAttempt((value) => value + 1)
            else setFailed(true)
          }}
        />
      )}
    </div>
  )
}

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
  if (!image) return <ResilientProductImage key={suggestProductImage(alt, icon)} image={suggestProductImage(alt, icon)} icon={icon} alt={alt} className={className} />
  return <ResilientProductImage key={image} image={image} icon={icon} alt={alt} className={className} />
}
