'use client'

import { useState } from 'react'
import { ProductIconTile } from './product-icon'
import { cn } from '@/lib/utils'

export function ProductIllustration({
  icon,
  name,
  category,
  className,
  compact = false,
}: {
  icon: string
  name?: string
  category?: string
  className?: string
  compact?: boolean
}) {
  return (
    <ProductIconTile
      icon={icon}
      name={name}
      category={category}
      compact={compact}
      className={className}
    />
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
  category,
  className,
}: {
  image: string
  icon: string
  alt: string
  category?: string
  className?: string
}) {
  const [attempt, setAttempt] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const retryable = image.startsWith('/uploads/products/')

  return (
    <div className={cn('relative overflow-hidden rounded-xl bg-[#F5F9FF]', className)}>
      <ProductIconTile
        icon={icon}
        name={alt}
        category={category}
        className="absolute inset-0 size-full rounded-none"
      />
      {!failed ? (
        <img
          key={`${image}-${attempt}`}
          src={retryUrl(image, attempt)}
          alt={alt}
          className={cn(
            'absolute inset-0 size-full object-contain transition-opacity duration-200',
            loaded ? 'opacity-100' : 'opacity-0',
          )}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => {
            setLoaded(false)
            if (retryable && attempt < 2) setAttempt(value => value + 1)
            else setFailed(true)
          }}
        />
      ) : null}
    </div>
  )
}

export function ProductImage({
  image,
  icon,
  alt,
  category,
  className,
  mode = 'auto',
}: {
  image?: string | null
  icon: string
  alt: string
  category?: string
  className?: string
  mode?: 'auto' | 'icon' | 'image'
}) {
  const defaultPlaceholder = Boolean(image?.startsWith('/products/default/'))
  const useIcon = mode === 'icon' || !image || defaultPlaceholder

  if (useIcon) {
    return (
      <ProductIconTile
        icon={icon}
        name={alt}
        category={category}
        className={className}
      />
    )
  }

  return (
    <ResilientProductImage
      key={image}
      image={image}
      icon={icon}
      alt={alt}
      category={category}
      className={className}
    />
  )
}
