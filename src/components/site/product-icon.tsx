'use client'

import { useState, type ComponentType, type SVGProps } from 'react'
import {
  Bot,
  Cloud,
  Code2,
  Gamepad2,
  HardDrive,
  KeyRound,
  Mail,
  Music2,
  Package,
  Server,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type SvgIcon = ComponentType<SVGProps<SVGSVGElement>>

export type ProductIconKey =
  | 'windows'
  | 'office'
  | 'visual-studio'
  | 'server'
  | 'adobe'
  | 'canva'
  | 'capcut'
  | 'corel'
  | 'autodesk'
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'x'
  | 'telegram'
  | 'youtube'
  | 'openai'
  | 'claude'
  | 'gemini'
  | 'grok'
  | 'perplexity'
  | 'cursor'
  | 'spotify'
  | 'netflix'
  | 'rakuten'
  | 'viki'
  | 'fl-studio'
  | 'ableton'
  | 'steam'
  | 'gaming'
  | 'drive'
  | 'cloud'
  | 'vpn'
  | 'email'
  | 'code'
  | 'license'
  | 'generic'

type ProductIconMeta = {
  key: ProductIconKey
  label: string
  accent: string
  soft: string
  domain?: string
  Icon?: SvgIcon
  monogram?: string
}

const META: Record<ProductIconKey, ProductIconMeta> = {
  windows: { key: 'windows', label: 'Windows', accent: '#0078D4', soft: '#EAF4FF', domain: 'windows.com' },
  office: { key: 'office', label: 'Microsoft', accent: '#F25022', soft: '#FFF1EB', domain: 'office.com' },
  'visual-studio': { key: 'visual-studio', label: 'Visual Studio', accent: '#7F52FF', soft: '#F2EBFF', domain: 'visualstudio.microsoft.com' },
  server: { key: 'server', label: 'Windows Server', accent: '#0078D4', soft: '#EAF4FF', domain: 'microsoft.com', Icon: Server },
  adobe: { key: 'adobe', label: 'Adobe', accent: '#FF0000', soft: '#FFF0F0', domain: 'adobe.com' },
  canva: { key: 'canva', label: 'Canva', accent: '#7D2AE8', soft: '#F4ECFF', domain: 'canva.com' },
  capcut: { key: 'capcut', label: 'CapCut', accent: '#111827', soft: '#F1F5F9', domain: 'capcut.com' },
  corel: { key: 'corel', label: 'CorelDRAW', accent: '#00A651', soft: '#EAF8EF', domain: 'coreldraw.com' },
  autodesk: { key: 'autodesk', label: 'Autodesk', accent: '#0696D7', soft: '#E8F7FE', domain: 'autodesk.com' },
  facebook: { key: 'facebook', label: 'Facebook', accent: '#1877F2', soft: '#EAF3FF', domain: 'facebook.com' },
  instagram: { key: 'instagram', label: 'Instagram', accent: '#E1306C', soft: '#FDECF4', domain: 'instagram.com' },
  tiktok: { key: 'tiktok', label: 'TikTok', accent: '#111827', soft: '#F0F3F7', domain: 'tiktok.com' },
  x: { key: 'x', label: 'X', accent: '#111827', soft: '#F0F3F7', domain: 'x.com' },
  telegram: { key: 'telegram', label: 'Telegram', accent: '#229ED9', soft: '#E8F7FF', domain: 'telegram.org' },
  youtube: { key: 'youtube', label: 'YouTube', accent: '#FF0000', soft: '#FFF0F0', domain: 'youtube.com' },
  openai: { key: 'openai', label: 'OpenAI', accent: '#10A37F', soft: '#E9F8F3', domain: 'openai.com', Icon: Bot },
  claude: { key: 'claude', label: 'Claude', accent: '#D97757', soft: '#FFF0EA', domain: 'claude.ai', monogram: 'AI' },
  gemini: { key: 'gemini', label: 'Gemini', accent: '#4F46E5', soft: '#EEF0FF', domain: 'gemini.google.com', Icon: Sparkles },
  grok: { key: 'grok', label: 'Grok', accent: '#111827', soft: '#F0F3F7', domain: 'grok.com', monogram: 'G' },
  perplexity: { key: 'perplexity', label: 'Perplexity', accent: '#0F766E', soft: '#E7F7F5', domain: 'perplexity.ai', monogram: 'P' },
  cursor: { key: 'cursor', label: 'Cursor', accent: '#111827', soft: '#F0F3F7', domain: 'cursor.com', Icon: Code2 },
  spotify: { key: 'spotify', label: 'Spotify', accent: '#1DB954', soft: '#EAF8EF', domain: 'spotify.com', Icon: Music2 },
  netflix: { key: 'netflix', label: 'Netflix', accent: '#E50914', soft: '#FFEDEF', domain: 'netflix.com', monogram: 'N' },
  rakuten: { key: 'rakuten', label: 'Rakuten', accent: '#BF0000', soft: '#FFF0F0', domain: 'rakuten.com', monogram: 'R' },
  viki: { key: 'viki', label: 'Viki', accent: '#06B6D4', soft: '#E8FAFD', domain: 'viki.com', monogram: 'V' },
  'fl-studio': { key: 'fl-studio', label: 'FL Studio', accent: '#F59E0B', soft: '#FFF7DF', domain: 'image-line.com', Icon: Music2 },
  ableton: { key: 'ableton', label: 'Ableton', accent: '#111827', soft: '#F0F3F7', domain: 'ableton.com', Icon: Music2 },
  steam: { key: 'steam', label: 'Steam', accent: '#1B2838', soft: '#EAF0F7', domain: 'steampowered.com', Icon: Gamepad2 },
  gaming: { key: 'gaming', label: 'Gaming', accent: '#6366F1', soft: '#EEF0FF', Icon: Gamepad2 },
  drive: { key: 'drive', label: 'Google Drive', accent: '#2563EB', soft: '#EAF3FF', domain: 'drive.google.com', Icon: HardDrive },
  cloud: { key: 'cloud', label: 'Cloud', accent: '#0EA5E9', soft: '#E8F7FE', Icon: Cloud },
  vpn: { key: 'vpn', label: 'VPN', accent: '#2563EB', soft: '#EAF3FF', domain: 'nordvpn.com', Icon: ShieldCheck },
  email: { key: 'email', label: 'E-mail', accent: '#0F766E', soft: '#E7F7F5', domain: 'mail.google.com', Icon: Mail },
  code: { key: 'code', label: 'Developer', accent: '#7C3AED', soft: '#F0EAFF', domain: 'github.com', Icon: Code2 },
  license: { key: 'license', label: 'License', accent: '#2563EB', soft: '#EAF3FF', Icon: KeyRound },
  generic: { key: 'generic', label: 'Digital', accent: '#1677FF', soft: '#EAF3FF', Icon: Package },
}

type DetectionInput = {
  name?: string | null
  category?: string | null
  icon?: string | null
}

const RULES: Array<{ key: ProductIconKey; test: RegExp }> = [
  { key: 'server', test: /windows\s+server|server\s*20\d{2}/i },
  { key: 'visual-studio', test: /visual\s*studio/i },
  { key: 'office', test: /microsoft\s*365|office\s*(365|20\d{2}|lt[sc])|ms\s*office|microsoft\s*project|\bproject\s*(pro|professional|standard)?\s*20\d{2}/i },
  { key: 'windows', test: /\bwindows\s*(7|8|10|11|pro|home|enterprise|professional|ultimate|oem|retail)/i },
  { key: 'adobe', test: /adobe|photoshop|illustrator|premiere|after\s*effects|lightroom|acrobat/i },
  { key: 'canva', test: /canva/i },
  { key: 'capcut', test: /cap\s*cut|capcut/i },
  { key: 'corel', test: /corel\s*draw|coreldraw|corel/i },
  { key: 'autodesk', test: /autodesk|autocad|revit|3ds\s*max|fusion\s*360|inventor|maya/i },
  { key: 'facebook', test: /facebook|meta\s*(business|ads|account)|business\s*manager/i },
  { key: 'instagram', test: /instagram|\binsta\b/i },
  { key: 'tiktok', test: /tik\s*tok|tiktok/i },
  { key: 'telegram', test: /telegram/i },
  { key: 'youtube', test: /youtube/i },
  { key: 'x', test: /twitter|(^|\s)x\s*(account|followers|premium|blue|tool|хэрэгсэл)/i },
  { key: 'openai', test: /chat\s*gpt|chatgpt|openai|sora/i },
  { key: 'claude', test: /claude/i },
  { key: 'gemini', test: /gemini|google\s*ai|notebook\s*lm|notebooklm/i },
  { key: 'grok', test: /\bgrok\b/i },
  { key: 'perplexity', test: /perplexity/i },
  { key: 'cursor', test: /cursor\s*(ai|pro|business|account)?/i },
  { key: 'spotify', test: /spotify/i },
  { key: 'netflix', test: /netflix/i },
  { key: 'rakuten', test: /rakuten/i },
  { key: 'viki', test: /\bviki\b/i },
  { key: 'fl-studio', test: /fl\s*studio|image[- ]line/i },
  { key: 'ableton', test: /ableton|live\s*(11|12)\s*(suite|standard|intro)/i },
  { key: 'steam', test: /steam/i },
  { key: 'vpn', test: /vpn|nordvpn|surfshark|expressvpn|protonvpn|exitlag|proxy/i },
  { key: 'email', test: /e-?mail|gmail|outlook\s*(account|mail)?|hotmail/i },
  { key: 'drive', test: /google\s*drive|onedrive|dropbox|storage|5\s*tb|2\s*tb/i },
  { key: 'cloud', test: /cloud|icloud/i },
  { key: 'code', test: /github|gitlab|developer|coding|code\s*tool|windsurf|lovable|loveable/i },
  { key: 'gaming', test: /gaming|playstation|xbox|nintendo|game\s*(pass|key|code)|valorant|roblox/i },
]

const ICON_FALLBACKS: Record<string, ProductIconKey> = {
  Facebook: 'facebook',
  Instagram: 'instagram',
  Twitter: 'x',
  Send: 'telegram',
  Music2: 'spotify',
  Mail: 'email',
  Sparkles: 'openai',
}

export function detectProductIcon(input: DetectionInput): ProductIconMeta {
  const name = (input.name || '').trim()
  const category = (input.category || '').trim()
  const haystack = `${name} ${category}`

  for (const rule of RULES) {
    if (rule.test.test(haystack)) return META[rule.key]
  }

  const categoryLower = category.toLowerCase()
  if (categoryLower.includes('windows')) return META.windows
  if (categoryLower.includes('facebook')) return META.facebook
  if (categoryLower.includes('instagram')) return META.instagram
  if (categoryLower.includes('tiktok')) return META.tiktok
  if (categoryLower === 'x хэрэгсэл' || categoryLower.startsWith('x ')) return META.x
  if (categoryLower.includes('ai')) return META.openai
  if (categoryLower.includes('хөгжим') || categoryLower.includes('audio')) return META.spotify
  if (categoryLower.includes('vpn') || categoryLower.includes('аюулгүй')) return META.vpn
  if (categoryLower.includes('cloud') || categoryLower.includes('storage')) return META.cloud
  if (categoryLower.includes('gaming') || categoryLower.includes('network')) return META.gaming
  if (categoryLower.includes('код') || categoryLower.includes('хөгжүүлэлт')) return META.code
  if (categoryLower.includes('и-мэйл') || categoryLower.includes('account')) return META.email
  if (categoryLower.includes('программ') || categoryLower.includes('лиценз') || categoryLower.includes('office')) return META.license

  const iconFallback = input.icon ? ICON_FALLBACKS[input.icon] : undefined
  return META[iconFallback || 'generic']
}

function faviconUrl(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`
}

function FallbackGlyph({ meta, compact }: { meta: ProductIconMeta; compact: boolean }) {
  const Glyph = meta.Icon
  if (Glyph) return <Glyph className={compact ? 'size-8' : 'size-14'} strokeWidth={1.75} />
  return (
    <span className={cn('font-black tracking-[-0.08em]', compact ? 'text-2xl' : 'text-[42px]')}>
      {meta.monogram || meta.label.slice(0, 1)}
    </span>
  )
}

export function ProductIconTile({
  name,
  category,
  icon,
  className,
  compact = false,
}: DetectionInput & {
  className?: string
  compact?: boolean
}) {
  const meta = detectProductIcon({ name, category, icon })
  const [logoFailed, setLogoFailed] = useState(false)

  // One optical sizing system across every product:
  // catalog frame 112/68, cart frame 56/34. All brand marks sit in the same box.
  const frameSize = compact ? 56 : 112
  const markSize = compact ? 34 : 68

  return (
    <div
      className={cn(
        'product-icon-tile relative grid place-items-center overflow-hidden rounded-[18px]',
        compact ? 'size-[72px] shrink-0' : 'h-full w-full min-h-[116px]',
        className,
      )}
      style={{
        background: `linear-gradient(135deg, #ffffff 0%, ${meta.soft} 100%)`,
      }}
      data-product-icon={meta.key}
      aria-label={`${meta.label} icon`}
    >
      <span
        className={cn(
          'absolute rounded-full opacity-[0.16] blur-2xl',
          compact ? 'size-14' : 'size-36',
        )}
        style={{ background: meta.accent }}
        aria-hidden="true"
      />

      <span
        className={cn(
          'relative z-10 grid place-items-center overflow-hidden rounded-[22px] border border-white/95 bg-white shadow-[0_12px_28px_-14px_rgba(15,23,42,.24),inset_0_1px_0_rgba(255,255,255,.95)]',
          compact ? 'rounded-[16px]' : '',
        )}
        style={{
          color: meta.accent,
          width: frameSize,
          height: frameSize,
        }}
      >
        {meta.domain && !logoFailed ? (
          <img
            src={faviconUrl(meta.domain)}
            alt={meta.label}
            width={128}
            height={128}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="block object-contain"
            style={{
              width: markSize,
              height: markSize,
              maxWidth: markSize,
              maxHeight: markSize,
            }}
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <FallbackGlyph meta={meta} compact={compact} />
        )}
      </span>
    </div>
  )
}
