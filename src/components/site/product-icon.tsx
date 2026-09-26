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
import { detectGameBrand } from '@/lib/game-brand'

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
  | 'dota2'
  | 'valorant'
  | 'minecraft'
  | 'counter-strike'
  | 'gaming'
  | 'drive'
  | 'cloud'
  | 'vpn'
  | 'email'
  | 'code'
  | 'license'
  | 'notion'
  | 'midjourney'
  | 'maxcare'
  | 'mkt'
  | 'photoshop'
  | 'illustrator'
  | 'premiere'
  | 'after-effects'
  | 'lightroom'
  | 'acrobat'
  | 'onedrive'
  | 'dropbox'
  | 'icloud'
  | 'gmail'
  | 'outlook'
  | 'github'
  | 'gitlab'
  | 'windsurf'
  | 'lovable'
  | 'nordvpn'
  | 'surfshark'
  | 'expressvpn'
  | 'protonvpn'
  | 'roblox'
  | 'xbox'
  | 'playstation'
  | 'nintendo'
  | 'figma'
  | 'suno'
  | 'elevenlabs'
  | 'grammarly'
  | 'zoom'
  | 'ai'
  | 'music'
  | 'generic'

type ProductIconMeta = {
  key: ProductIconKey
  label: string
  accent: string
  soft: string
  domain?: string
  asset?: string
  Icon?: SvgIcon
  monogram?: string
}

const META: Record<ProductIconKey, ProductIconMeta> = {
  'notion': { key: 'notion', label: 'Notion', accent: '#111827', soft: '#F1F5F9', domain: 'notion.so', monogram: 'N' },
  'midjourney': { key: 'midjourney', label: 'Midjourney', accent: '#334155', soft: '#F1F5F9', domain: 'midjourney.com', monogram: 'M' },
  'maxcare': { key: 'maxcare', label: 'MaxCare', accent: '#7C3AED', soft: '#F1F5F9', monogram: 'MC' },
  'mkt': { key: 'mkt', label: 'MKT', accent: '#2563EB', soft: '#F1F5F9', monogram: 'MKT' },
  'photoshop': { key: 'photoshop', label: 'Photoshop', accent: '#1265B5', soft: '#F1F5F9', monogram: 'Ps' },
  'illustrator': { key: 'illustrator', label: 'Illustrator', accent: '#B85A00', soft: '#F1F5F9', monogram: 'Ai' },
  'premiere': { key: 'premiere', label: 'Premiere Pro', accent: '#6D28D9', soft: '#F1F5F9', monogram: 'Pr' },
  'after-effects': { key: 'after-effects', label: 'After Effects', accent: '#6D28D9', soft: '#F1F5F9', monogram: 'Ae' },
  'lightroom': { key: 'lightroom', label: 'Lightroom', accent: '#1265B5', soft: '#F1F5F9', monogram: 'Lr' },
  'acrobat': { key: 'acrobat', label: 'Acrobat', accent: '#DC2626', soft: '#F1F5F9', monogram: 'Ac' },
  'onedrive': { key: 'onedrive', label: 'OneDrive', accent: '#0078D4', soft: '#F1F5F9', domain: 'onedrive.live.com', monogram: 'OD' },
  'dropbox': { key: 'dropbox', label: 'Dropbox', accent: '#0061FF', soft: '#F1F5F9', domain: 'dropbox.com', monogram: 'D' },
  'icloud': { key: 'icloud', label: 'iCloud', accent: '#0284C7', soft: '#F1F5F9', domain: 'icloud.com', monogram: 'C' },
  'gmail': { key: 'gmail', label: 'Gmail', accent: '#B91C1C', soft: '#F1F5F9', domain: 'mail.google.com', monogram: 'G' },
  'outlook': { key: 'outlook', label: 'Outlook', accent: '#0078D4', soft: '#F1F5F9', domain: 'outlook.com', monogram: 'O' },
  'github': { key: 'github', label: 'GitHub', accent: '#111827', soft: '#F1F5F9', domain: 'github.com', monogram: 'GH' },
  'gitlab': { key: 'gitlab', label: 'GitLab', accent: '#C2410C', soft: '#F1F5F9', domain: 'gitlab.com', monogram: 'GL' },
  'windsurf': { key: 'windsurf', label: 'Windsurf', accent: '#0F766E', soft: '#F1F5F9', domain: 'windsurf.com', monogram: 'W' },
  'lovable': { key: 'lovable', label: 'Lovable', accent: '#BE185D', soft: '#F1F5F9', domain: 'lovable.dev', monogram: 'L' },
  'nordvpn': { key: 'nordvpn', label: 'NordVPN', accent: '#2563EB', soft: '#F1F5F9', domain: 'nordvpn.com', monogram: 'NVP' },
  'surfshark': { key: 'surfshark', label: 'Surfshark', accent: '#0F766E', soft: '#F1F5F9', domain: 'surfshark.com', monogram: 'S' },
  'expressvpn': { key: 'expressvpn', label: 'ExpressVPN', accent: '#B91C1C', soft: '#F1F5F9', domain: 'expressvpn.com', monogram: 'EVP' },
  'protonvpn': { key: 'protonvpn', label: 'Proton VPN', accent: '#6D28D9', soft: '#F1F5F9', domain: 'protonvpn.com', monogram: 'PVP' },
  'roblox': { key: 'roblox', label: 'Roblox', accent: '#111827', soft: '#F1F5F9', domain: 'roblox.com', monogram: 'R' },
  'xbox': { key: 'xbox', label: 'Xbox', accent: '#107C10', soft: '#F1F5F9', domain: 'xbox.com', monogram: 'X' },
  'playstation': { key: 'playstation', label: 'PlayStation', accent: '#003791', soft: '#F1F5F9', domain: 'playstation.com', monogram: 'PS' },
  'nintendo': { key: 'nintendo', label: 'Nintendo', accent: '#E60012', soft: '#F1F5F9', domain: 'nintendo.com', monogram: 'N' },
  'figma': { key: 'figma', label: 'Figma', accent: '#7C3AED', soft: '#F1F5F9', domain: 'figma.com', monogram: 'F' },
  'suno': { key: 'suno', label: 'Suno', accent: '#C2410C', soft: '#F1F5F9', domain: 'suno.com', monogram: 'S' },
  'elevenlabs': { key: 'elevenlabs', label: 'ElevenLabs', accent: '#111827', soft: '#F1F5F9', domain: 'elevenlabs.io', monogram: 'EL' },
  'grammarly': { key: 'grammarly', label: 'Grammarly', accent: '#15803D', soft: '#F1F5F9', domain: 'grammarly.com', monogram: 'G' },
  'zoom': { key: 'zoom', label: 'Zoom', accent: '#2563EB', soft: '#F1F5F9', domain: 'zoom.us', monogram: 'Z' },
  'ai': { key: 'ai', label: 'AI', accent: '#7C3AED', soft: '#F1F5F9', monogram: 'AI' },
  'music': { key: 'music', label: 'Music', accent: '#BE185D', soft: '#F1F5F9', monogram: 'M' },
  windows: { key: 'windows', label: 'Windows', accent: '#0078D4', soft: '#EAF4FF', domain: 'windows.com' },
  office: { key: 'office', label: 'Microsoft', accent: '#F25022', soft: '#FFF1EB', domain: 'office.com', asset: '/brand-icons/microsoft-office.svg' },
  'visual-studio': { key: 'visual-studio', label: 'Visual Studio', accent: '#7F52FF', soft: '#F2EBFF', domain: 'visualstudio.microsoft.com' },
  server: { key: 'server', label: 'Windows Server', accent: '#0078D4', soft: '#EAF4FF', domain: 'microsoft.com', Icon: Server },
  adobe: { key: 'adobe', label: 'Adobe', accent: '#FF0000', soft: '#FFF0F0', domain: 'adobe.com', asset: '/brand-icons/adobe.svg' },
  canva: { key: 'canva', label: 'Canva', accent: '#7D2AE8', soft: '#F4ECFF', domain: 'canva.com' },
  capcut: { key: 'capcut', label: 'CapCut', accent: '#111827', soft: '#F1F5F9', domain: 'capcut.com', asset: '/brand-icons/capcut.svg' },
  corel: { key: 'corel', label: 'CorelDRAW', accent: '#00A651', soft: '#EAF8EF', domain: 'coreldraw.com' },
  autodesk: { key: 'autodesk', label: 'Autodesk', accent: '#0696D7', soft: '#E8F7FE', domain: 'autodesk.com', asset: '/brand-icons/autodesk.svg' },
  facebook: { key: 'facebook', label: 'Facebook', accent: '#1877F2', soft: '#EAF3FF', domain: 'facebook.com' },
  instagram: { key: 'instagram', label: 'Instagram', accent: '#E1306C', soft: '#FDECF4', domain: 'instagram.com' },
  tiktok: { key: 'tiktok', label: 'TikTok', accent: '#111827', soft: '#F0F3F7', domain: 'tiktok.com', asset: '/brand-icons/tiktok.svg' },
  x: { key: 'x', label: 'X', accent: '#111827', soft: '#F0F3F7', domain: 'x.com' },
  telegram: { key: 'telegram', label: 'Telegram', accent: '#229ED9', soft: '#E8F7FF', domain: 'telegram.org' },
  youtube: { key: 'youtube', label: 'YouTube', accent: '#FF0000', soft: '#FFF0F0', domain: 'youtube.com' },
  openai: { key: 'openai', label: 'OpenAI', accent: '#10A37F', soft: '#E9F8F3', domain: 'openai.com', Icon: Bot },
  claude: { key: 'claude', label: 'Claude', accent: '#D97757', soft: '#FFF0EA', domain: 'claude.ai', asset: '/brand-icons/claude.svg', monogram: 'AI' },
  gemini: { key: 'gemini', label: 'Gemini', accent: '#4F46E5', soft: '#EEF0FF', domain: 'gemini.google.com', Icon: Sparkles },
  grok: { key: 'grok', label: 'Grok', accent: '#111827', soft: '#F0F3F7', domain: 'grok.com', monogram: 'G' },
  perplexity: { key: 'perplexity', label: 'Perplexity', accent: '#0F766E', soft: '#E7F7F5', domain: 'perplexity.ai', monogram: 'P' },
  cursor: { key: 'cursor', label: 'Cursor', accent: '#111827', soft: '#F0F3F7', domain: 'cursor.com', Icon: Code2 },
  spotify: { key: 'spotify', label: 'Spotify', accent: '#1DB954', soft: '#EAF8EF', domain: 'spotify.com', asset: '/brand-icons/spotify.svg', Icon: Music2 },
  netflix: { key: 'netflix', label: 'Netflix', accent: '#E50914', soft: '#FFEDEF', domain: 'netflix.com', monogram: 'N' },
  rakuten: { key: 'rakuten', label: 'Rakuten', accent: '#BF0000', soft: '#FFF0F0', domain: 'rakuten.com', monogram: 'R' },
  viki: { key: 'viki', label: 'Viki', accent: '#06B6D4', soft: '#E8FAFD', domain: 'viki.com', monogram: 'V' },
  'fl-studio': { key: 'fl-studio', label: 'FL Studio', accent: '#F59E0B', soft: '#FFF7DF', domain: 'image-line.com', Icon: Music2 },
  ableton: { key: 'ableton', label: 'Ableton', accent: '#111827', soft: '#F0F3F7', domain: 'ableton.com', Icon: Music2 },
  steam: { key: 'steam', label: 'Steam', accent: '#1B2838', soft: '#EAF0F7', domain: 'steampowered.com', Icon: Gamepad2 },
  dota2: { key: 'dota2', label: 'Dota 2', accent: '#B73529', soft: '#FFF0EC', asset: '/brand-icons/dota2.svg', monogram: 'D2' },
  valorant: { key: 'valorant', label: 'Valorant', accent: '#FF4655', soft: '#FFF0F2', asset: '/brand-icons/valorant.svg', monogram: 'V' },
  minecraft: { key: 'minecraft', label: 'Minecraft', accent: '#3C8527', soft: '#EFF8EA', domain: 'minecraft.net', monogram: 'MC' },
  'counter-strike': { key: 'counter-strike', label: 'Counter-Strike', accent: '#C87912', soft: '#FFF6E6', asset: '/brand-icons/counter-strike.svg', monogram: 'CS' },
  gaming: { key: 'gaming', label: 'Gaming', accent: '#6366F1', soft: '#EEF0FF', Icon: Gamepad2 },
  drive: { key: 'drive', label: 'Google Drive', accent: '#2563EB', soft: '#EAF3FF', domain: 'drive.google.com', Icon: HardDrive },
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
  { key: 'gemini', test: /gemini|google\s*ai|notebook\s*lm|notebooklm/i },
  { key: 'notion', test: /notion/i },
  { key: 'midjourney', test: /mid\s*journey/i },
  { key: 'maxcare', test: /max\s*care/i },
  { key: 'mkt', test: /\bmkt\b/i },
  { key: 'photoshop', test: /photoshop/i },
  { key: 'illustrator', test: /illustrator/i },
  { key: 'premiere', test: /premiere/i },
  { key: 'after-effects', test: /after\s*effects/i },
  { key: 'lightroom', test: /lightroom/i },
  { key: 'acrobat', test: /acrobat/i },
  { key: 'onedrive', test: /one\s*drive/i },
  { key: 'dropbox', test: /dropbox/i },
  { key: 'icloud', test: /icloud/i },
  { key: 'gmail', test: /gmail/i },
  { key: 'outlook', test: /outlook|hotmail/i },
  { key: 'github', test: /github/i },
  { key: 'gitlab', test: /gitlab/i },
  { key: 'windsurf', test: /windsurf/i },
  { key: 'lovable', test: /love?able/i },
  { key: 'nordvpn', test: /nord\s*vpn/i },
  { key: 'surfshark', test: /surf\s*shark/i },
  { key: 'expressvpn', test: /express\s*vpn/i },
  { key: 'protonvpn', test: /proton\s*vpn/i },
  { key: 'roblox', test: /roblox/i },
  { key: 'xbox', test: /xbox|game\s*pass/i },
  { key: 'playstation', test: /play\s*station/i },
  { key: 'nintendo', test: /nintendo/i },
  { key: 'figma', test: /figma/i },
  { key: 'suno', test: /\bsuno\b/i },
  { key: 'elevenlabs', test: /eleven\s*labs/i },
  { key: 'grammarly', test: /grammarly/i },
  { key: 'zoom', test: /\bzoom\b/i },
  { key: 'dota2', test: /\bdota\s*2?\b|дота\s*2?/i },
  { key: 'valorant', test: /\bvalorant\b|валорант/i },
  { key: 'minecraft', test: /\bminecraft\b|майнкрафт/i },
  { key: 'counter-strike', test: /\bcounter[\s-]*strike\b|\bcs(?:\s*2|[\s:]*go|\s*1\.6)?\b|кантер\s*страйк/i },
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
  { key: 'drive', test: /google\s*drive/i },
  { key: 'cloud', test: /cloud|icloud/i },
  { key: 'code', test: /github|gitlab|developer|coding|code\s*tool|windsurf|lovable|loveable/i },
  { key: 'gaming', test: /gaming|playstation|xbox|nintendo|game\s*(pass|key|code)|valorant|roblox/i },
]

const ICON_FALLBACKS: Record<string, ProductIconKey> = {
  Facebook: 'facebook',
  Instagram: 'instagram',
  Twitter: 'x',
  Send: 'telegram',
  Music2: 'music',
  Mail: 'email',
  Sparkles: 'ai',
}

export function detectProductIcon(input: DetectionInput): ProductIconMeta {
  const name = (input.name || '').normalize('NFKC').replace(/[‐‑–—_]/g, ' ').replace(/\s+/g, ' ').trim()
  const category = (input.category || '').trim()
  // Explicit multilingual game matches take precedence over broad generic rules.
  // Game assets are self-hosted, never unreliable site favicons.
  const game = detectGameBrand({ name, category, icon: input.icon })
  if (game) return META[game]
  // Match names first. Categories must never assign an unrelated brand.
  for (const rule of RULES) {
    if (rule.test.test(name)) return META[rule.key]
  }

  // Unknown products receive a stable, name-specific mark instead of a
  // competitor's logo inferred from their category or legacy Lucide icon.
  if (name) {
    const words = name.match(/[\p{L}\p{N}]+/gu) || []
    const monogram = (words.length > 1
      ? words.slice(0, 2).map(word => Array.from(word)[0]).join('')
      : Array.from(words[0] || '?').slice(0, 2).join('')).toUpperCase()
    let hash = 0
    for (const char of name.toLowerCase()) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0
    const colors = ['#2563EB', '#7C3AED', '#0F766E', '#BE185D', '#B45309', '#4338CA']
    return { key: 'generic', label: name, accent: colors[hash % colors.length], soft: '#F1F5F9', monogram }
  }

  for (const rule of RULES) {
    if (rule.test.test(category)) return META[rule.key]
  }
  const categoryLower = category.toLowerCase()
  if (categoryLower.includes('ai')) return META.ai
  if (/хөгжим|audio/.test(categoryLower)) return META.music
  if (/vpn|аюулгүй/.test(categoryLower)) return META.vpn
  if (/cloud|storage/.test(categoryLower)) return META.cloud
  if (/gaming|network/.test(categoryLower)) return META.gaming
  if (/код|хөгжүүлэлт/.test(categoryLower)) return META.code
  if (/и-мэйл|account/.test(categoryLower)) return META.email
  if (/программ|лиценз|office/.test(categoryLower)) return META.license

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
  const source = meta.asset || (meta.domain ? faviconUrl(meta.domain) : '')
  const [failedSource, setFailedSource] = useState<string | null>(null)

  // One optical sizing system across every product:
  // catalog frame 112/68, cart frame 56/34. All brand marks sit in the same box.
  const frameSize = compact ? 56 : 112
  const markSize = meta.key === 'counter-strike' ? (compact ? 40 : 78) : compact ? 34 : 68

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
        {source && failedSource !== source ? (
          <img
            key={source}
            src={source}
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
            onError={() => setFailedSource(source)}
          />
        ) : (
          <FallbackGlyph meta={meta} compact={compact} />
        )}
      </span>
    </div>
  )
}
