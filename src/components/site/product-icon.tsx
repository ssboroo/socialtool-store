import type { ComponentType, SVGProps } from 'react'
import {
  Bot,
  Box,
  BriefcaseBusiness,
  Cloud,
  Code2,
  Facebook,
  Film,
  Gamepad2,
  HardDrive,
  Instagram,
  KeyRound,
  Mail,
  MessageCircle,
  Monitor,
  Music2,
  Package,
  Send,
  Server,
  ShieldCheck,
  Sparkles,
  Twitter,
  Youtube,
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
  Icon?: SvgIcon
  monogram?: string
  windows?: boolean
}

const META: Record<ProductIconKey, ProductIconMeta> = {
  windows: { key: 'windows', label: 'Windows', accent: '#1677FF', soft: '#EAF3FF', windows: true },
  office: { key: 'office', label: 'Microsoft', accent: '#F97316', soft: '#FFF1E8', monogram: 'M' },
  'visual-studio': { key: 'visual-studio', label: 'Visual Studio', accent: '#7C3AED', soft: '#F2EBFF', Icon: Code2 },
  server: { key: 'server', label: 'Server', accent: '#2563EB', soft: '#EAF2FF', Icon: Server },
  adobe: { key: 'adobe', label: 'Adobe', accent: '#EF233C', soft: '#FFEDEF', monogram: 'A' },
  canva: { key: 'canva', label: 'Canva', accent: '#7C3AED', soft: '#F0EAFF', monogram: 'C' },
  capcut: { key: 'capcut', label: 'CapCut', accent: '#111827', soft: '#F1F5F9', Icon: Film },
  corel: { key: 'corel', label: 'Corel', accent: '#16A34A', soft: '#EAF8EF', monogram: 'C' },
  autodesk: { key: 'autodesk', label: 'Autodesk', accent: '#0EA5E9', soft: '#E8F7FE', monogram: 'A' },
  facebook: { key: 'facebook', label: 'Facebook', accent: '#1877F2', soft: '#EAF3FF', Icon: Facebook },
  instagram: { key: 'instagram', label: 'Instagram', accent: '#D946EF', soft: '#FCEBFF', Icon: Instagram },
  tiktok: { key: 'tiktok', label: 'TikTok', accent: '#111827', soft: '#EEF2F7', Icon: Music2 },
  x: { key: 'x', label: 'X', accent: '#111827', soft: '#EEF2F7', Icon: Twitter },
  telegram: { key: 'telegram', label: 'Telegram', accent: '#229ED9', soft: '#E8F7FF', Icon: Send },
  youtube: { key: 'youtube', label: 'YouTube', accent: '#FF0033', soft: '#FFECEF', Icon: Youtube },
  openai: { key: 'openai', label: 'OpenAI', accent: '#10A37F', soft: '#E9F8F3', Icon: Bot },
  claude: { key: 'claude', label: 'Claude', accent: '#D97757', soft: '#FFF0EA', monogram: 'AI' },
  gemini: { key: 'gemini', label: 'Google AI', accent: '#4F46E5', soft: '#EEF0FF', Icon: Sparkles },
  grok: { key: 'grok', label: 'Grok', accent: '#111827', soft: '#EEF2F7', monogram: 'G' },
  perplexity: { key: 'perplexity', label: 'Perplexity', accent: '#0F766E', soft: '#E7F7F5', monogram: 'P' },
  cursor: { key: 'cursor', label: 'Cursor', accent: '#111827', soft: '#EEF2F7', Icon: Code2 },
  spotify: { key: 'spotify', label: 'Spotify', accent: '#1DB954', soft: '#EAF8EF', Icon: Music2 },
  netflix: { key: 'netflix', label: 'Netflix', accent: '#E50914', soft: '#FFEDEF', monogram: 'N' },
  rakuten: { key: 'rakuten', label: 'Rakuten', accent: '#BF0000', soft: '#FFF0F0', monogram: 'R' },
  viki: { key: 'viki', label: 'Viki', accent: '#06B6D4', soft: '#E8FAFD', monogram: 'V' },
  'fl-studio': { key: 'fl-studio', label: 'FL Studio', accent: '#F59E0B', soft: '#FFF7DF', Icon: Music2 },
  ableton: { key: 'ableton', label: 'Ableton', accent: '#111827', soft: '#EEF2F7', Icon: Music2 },
  steam: { key: 'steam', label: 'Steam', accent: '#1B2838', soft: '#EAF0F7', Icon: Gamepad2 },
  gaming: { key: 'gaming', label: 'Gaming', accent: '#6366F1', soft: '#EEF0FF', Icon: Gamepad2 },
  drive: { key: 'drive', label: 'Storage', accent: '#2563EB', soft: '#EAF3FF', Icon: HardDrive },
  cloud: { key: 'cloud', label: 'Cloud', accent: '#0EA5E9', soft: '#E8F7FE', Icon: Cloud },
  vpn: { key: 'vpn', label: 'VPN', accent: '#2563EB', soft: '#EAF3FF', Icon: ShieldCheck },
  email: { key: 'email', label: 'E-mail', accent: '#0F766E', soft: '#E7F7F5', Icon: Mail },
  code: { key: 'code', label: 'Developer', accent: '#7C3AED', soft: '#F0EAFF', Icon: Code2 },
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

function WindowsGlyph() {
  return (
    <span className="grid size-9 grid-cols-2 gap-0.5" aria-hidden="true">
      <span className="rounded-[2px] bg-current" />
      <span className="rounded-[2px] bg-current" />
      <span className="rounded-[2px] bg-current" />
      <span className="rounded-[2px] bg-current" />
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
  const Glyph = meta.Icon

  return (
    <div
      className={cn(
        'product-icon-tile relative grid place-items-center overflow-hidden rounded-xl',
        compact ? 'size-16 shrink-0' : 'h-full w-full min-h-24',
        className,
      )}
      style={{
        background: `radial-gradient(circle at 50% 42%, white 0%, ${meta.soft} 54%, ${meta.soft} 100%)`,
      }}
      data-product-icon={meta.key}
    >
      <span
        className={cn(
          'absolute rounded-full opacity-35 blur-2xl',
          compact ? 'size-12' : 'size-24',
        )}
        style={{ background: meta.accent }}
        aria-hidden="true"
      />
      <span
        className={cn(
          'relative grid place-items-center rounded-2xl border border-white/80 bg-white/88 shadow-[0_10px_30px_-16px_rgba(15,23,42,.35)]',
          compact ? 'size-12 rounded-xl' : 'size-[4.35rem]',
        )}
        style={{ color: meta.accent }}
      >
        {meta.windows ? (
          <WindowsGlyph />
        ) : Glyph ? (
          <Glyph className={compact ? 'size-6' : 'size-8'} strokeWidth={1.9} />
        ) : (
          <span className={cn('font-black tracking-[-0.08em]', compact ? 'text-xl' : 'text-2xl')}>
            {meta.monogram || '?'}
          </span>
        )}
      </span>
      {!compact ? (
        <span
          className="absolute bottom-2 rounded-full border border-white/80 bg-white/75 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] backdrop-blur"
          style={{ color: meta.accent }}
        >
          {meta.label}
        </span>
      ) : null}
    </div>
  )
}
