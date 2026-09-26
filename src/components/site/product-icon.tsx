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
import { detectProductBrandName, explicitProductBrand, categoryProductBrand } from '@/lib/product-brand'

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
  | 'gpm-login'
  | 'manychat'
  | 'metricool'
  | 'sendpulse'
  | 'adspower'
  | 'multilogin'
  | 'runway'
  | 'pika'
  | 'discord'
  | 'twitch'
  | 'epic-games'
  | 'riot-games'
  | 'league-of-legends'
  | 'pubg'
  | 'whatsapp'
  | 'linkedin'
  | 'pinterest'
  | 'snapchat'
  | 'g2g'
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
  'notion': { key: 'notion', label: 'Notion', accent: '#111827', soft: '#F1F5F9', domain: 'notion.so', monogram: 'N', asset: '/brand-icons/notion.svg' },
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
  'dropbox': { key: 'dropbox', label: 'Dropbox', accent: '#0061FF', soft: '#F1F5F9', domain: 'dropbox.com', monogram: 'D', asset: '/brand-icons/dropbox.svg' },
  'icloud': { key: 'icloud', label: 'iCloud', accent: '#0284C7', soft: '#F1F5F9', domain: 'icloud.com', monogram: 'C', asset: '/brand-icons/icloud.svg' },
  'gmail': { key: 'gmail', label: 'Gmail', accent: '#B91C1C', soft: '#F1F5F9', domain: 'mail.google.com', monogram: 'G', asset: '/brand-icons/gmail.svg' },
  'outlook': { key: 'outlook', label: 'Outlook', accent: '#0078D4', soft: '#F1F5F9', domain: 'outlook.com', monogram: 'O' },
  'github': { key: 'github', label: 'GitHub', accent: '#111827', soft: '#F1F5F9', domain: 'github.com', monogram: 'GH', asset: '/brand-icons/github.svg' },
  'gitlab': { key: 'gitlab', label: 'GitLab', accent: '#C2410C', soft: '#F1F5F9', domain: 'gitlab.com', monogram: 'GL', asset: '/brand-icons/gitlab.svg' },
  'windsurf': { key: 'windsurf', label: 'Windsurf', accent: '#0F766E', soft: '#F1F5F9', domain: 'windsurf.com', monogram: 'W', asset: '/brand-icons/windsurf.svg' },
  'lovable': { key: 'lovable', label: 'Lovable', accent: '#BE185D', soft: '#F1F5F9', domain: 'lovable.dev', monogram: 'L' },
  'nordvpn': { key: 'nordvpn', label: 'NordVPN', accent: '#2563EB', soft: '#F1F5F9', domain: 'nordvpn.com', monogram: 'NVP', asset: '/brand-icons/nordvpn.svg' },
  'surfshark': { key: 'surfshark', label: 'Surfshark', accent: '#0F766E', soft: '#F1F5F9', domain: 'surfshark.com', monogram: 'S', asset: '/brand-icons/surfshark.svg' },
  'expressvpn': { key: 'expressvpn', label: 'ExpressVPN', accent: '#B91C1C', soft: '#F1F5F9', domain: 'expressvpn.com', monogram: 'EVP', asset: '/brand-icons/expressvpn.svg' },
  'protonvpn': { key: 'protonvpn', label: 'Proton VPN', accent: '#6D28D9', soft: '#F1F5F9', domain: 'protonvpn.com', monogram: 'PVP', asset: '/brand-icons/protonvpn.svg' },
  'roblox': { key: 'roblox', label: 'Roblox', accent: '#111827', soft: '#F1F5F9', domain: 'roblox.com', monogram: 'R', asset: '/brand-icons/roblox.svg' },
  'xbox': { key: 'xbox', label: 'Xbox', accent: '#107C10', soft: '#F1F5F9', domain: 'xbox.com', monogram: 'X' },
  'playstation': { key: 'playstation', label: 'PlayStation', accent: '#003791', soft: '#F1F5F9', domain: 'playstation.com', monogram: 'PS', asset: '/brand-icons/playstation.svg' },
  'nintendo': { key: 'nintendo', label: 'Nintendo', accent: '#E60012', soft: '#F1F5F9', domain: 'nintendo.com', monogram: 'N' },
  'figma': { key: 'figma', label: 'Figma', accent: '#7C3AED', soft: '#F1F5F9', domain: 'figma.com', monogram: 'F', asset: '/brand-icons/figma.svg' },
  'suno': { key: 'suno', label: 'Suno', accent: '#C2410C', soft: '#F1F5F9', domain: 'suno.com', monogram: 'S', asset: '/brand-icons/suno.svg' },
  'elevenlabs': { key: 'elevenlabs', label: 'ElevenLabs', accent: '#111827', soft: '#F1F5F9', domain: 'elevenlabs.io', monogram: 'EL', asset: '/brand-icons/elevenlabs.svg' },
  'grammarly': { key: 'grammarly', label: 'Grammarly', accent: '#15803D', soft: '#F1F5F9', domain: 'grammarly.com', monogram: 'G', asset: '/brand-icons/grammarly.svg' },
  'zoom': { key: 'zoom', label: 'Zoom', accent: '#2563EB', soft: '#F1F5F9', domain: 'zoom.us', monogram: 'Z', asset: '/brand-icons/zoom.svg' },
  'ai': { key: 'ai', label: 'AI', accent: '#7C3AED', soft: '#F1F5F9', monogram: 'AI' },
  'music': { key: 'music', label: 'Music', accent: '#BE185D', soft: '#F1F5F9', monogram: 'M' },
  windows: { key: 'windows', label: 'Windows', accent: '#0078D4', soft: '#EAF4FF', domain: 'windows.com' },
  office: { key: 'office', label: 'Microsoft', accent: '#F25022', soft: '#FFF1EB', domain: 'office.com', asset: '/brand-icons/microsoft-office.svg' },
  'visual-studio': { key: 'visual-studio', label: 'Visual Studio', accent: '#7F52FF', soft: '#F2EBFF', domain: 'visualstudio.microsoft.com' },
  server: { key: 'server', label: 'Windows Server', accent: '#0078D4', soft: '#EAF4FF', domain: 'microsoft.com', Icon: Server },
  adobe: { key: 'adobe', label: 'Adobe', accent: '#FF0000', soft: '#FFF0F0', domain: 'adobe.com', asset: '/brand-icons/adobe.svg' },
  canva: { key: 'canva', label: 'Canva', accent: '#7D2AE8', soft: '#F4ECFF', domain: 'canva.com' },
  capcut: { key: 'capcut', label: 'CapCut', accent: '#111827', soft: '#F1F5F9', domain: 'capcut.com', asset: '/brand-icons/capcut.svg' },
  corel: { key: 'corel', label: 'CorelDRAW', accent: '#00A651', soft: '#EAF8EF', domain: 'coreldraw.com', asset: '/brand-icons/corel.svg' },
  autodesk: { key: 'autodesk', label: 'Autodesk', accent: '#0696D7', soft: '#E8F7FE', domain: 'autodesk.com', asset: '/brand-icons/autodesk.svg' },
  facebook: { key: 'facebook', label: 'Facebook', accent: '#1877F2', soft: '#EAF3FF', domain: 'facebook.com', asset: '/brand-icons/facebook.svg' },
  instagram: { key: 'instagram', label: 'Instagram', accent: '#E1306C', soft: '#FDECF4', domain: 'instagram.com', asset: '/brand-icons/instagram.svg' },
  tiktok: { key: 'tiktok', label: 'TikTok', accent: '#111827', soft: '#F0F3F7', domain: 'tiktok.com', asset: '/brand-icons/tiktok.svg' },
  x: { key: 'x', label: 'X', accent: '#111827', soft: '#F0F3F7', domain: 'x.com', asset: '/brand-icons/x.svg' },
  telegram: { key: 'telegram', label: 'Telegram', accent: '#229ED9', soft: '#E8F7FF', domain: 'telegram.org', asset: '/brand-icons/telegram.svg' },
  youtube: { key: 'youtube', label: 'YouTube', accent: '#FF0000', soft: '#FFF0F0', domain: 'youtube.com', asset: '/brand-icons/youtube.svg' },
  openai: { key: 'openai', label: 'OpenAI', accent: '#10A37F', soft: '#E9F8F3', domain: 'openai.com', Icon: Bot },
  claude: { key: 'claude', label: 'Claude', accent: '#D97757', soft: '#FFF0EA', domain: 'claude.ai', asset: '/brand-icons/claude.svg', monogram: 'AI' },
  gemini: { key: 'gemini', label: 'Gemini', accent: '#4F46E5', soft: '#EEF0FF', domain: 'gemini.google.com', Icon: Sparkles, asset: '/brand-icons/gemini.svg' },
  grok: { key: 'grok', label: 'Grok', accent: '#111827', soft: '#F0F3F7', domain: 'grok.com', monogram: 'G' },
  perplexity: { key: 'perplexity', label: 'Perplexity', accent: '#0F766E', soft: '#E7F7F5', domain: 'perplexity.ai', monogram: 'P', asset: '/brand-icons/perplexity.svg' },
  cursor: { key: 'cursor', label: 'Cursor', accent: '#111827', soft: '#F0F3F7', domain: 'cursor.com', Icon: Code2, asset: '/brand-icons/cursor.svg' },
  spotify: { key: 'spotify', label: 'Spotify', accent: '#1DB954', soft: '#EAF8EF', domain: 'spotify.com', asset: '/brand-icons/spotify.svg', Icon: Music2 },
  netflix: { key: 'netflix', label: 'Netflix', accent: '#E50914', soft: '#FFEDEF', domain: 'netflix.com', monogram: 'N', asset: '/brand-icons/netflix.svg' },
  rakuten: { key: 'rakuten', label: 'Rakuten', accent: '#BF0000', soft: '#FFF0F0', domain: 'rakuten.com', monogram: 'R' },
  viki: { key: 'viki', label: 'Viki', accent: '#06B6D4', soft: '#E8FAFD', domain: 'viki.com', monogram: 'V' },
  'fl-studio': { key: 'fl-studio', label: 'FL Studio', accent: '#F59E0B', soft: '#FFF7DF', domain: 'image-line.com', Icon: Music2 },
  ableton: { key: 'ableton', label: 'Ableton', accent: '#111827', soft: '#F0F3F7', domain: 'ableton.com', Icon: Music2 },
  steam: { key: 'steam', label: 'Steam', accent: '#1B2838', soft: '#EAF0F7', domain: 'steampowered.com', Icon: Gamepad2, asset: '/brand-icons/steam.svg' },
  dota2: { key: 'dota2', label: 'Dota 2', accent: '#B73529', soft: '#FFF0EC', asset: '/brand-icons/dota2.svg', monogram: 'D2' },
  valorant: { key: 'valorant', label: 'Valorant', accent: '#FF4655', soft: '#FFF0F2', asset: '/brand-icons/valorant.svg', monogram: 'V' },
  minecraft: { key: 'minecraft', label: 'Minecraft', accent: '#3C8527', soft: '#EFF8EA', domain: 'minecraft.net', monogram: 'MC' },
  'counter-strike': { key: 'counter-strike', label: 'Counter-Strike', accent: '#C87912', soft: '#FFF6E6', asset: '/brand-icons/counter-strike.svg', monogram: 'CS' },
  gaming: { key: 'gaming', label: 'Gaming', accent: '#6366F1', soft: '#EEF0FF', Icon: Gamepad2 },
  drive: { key: 'drive', label: 'Google Drive', accent: '#2563EB', soft: '#EAF3FF', domain: 'drive.google.com', Icon: HardDrive, asset: '/brand-icons/drive.svg' },
  cloud: { key: 'cloud', label: 'Cloud', accent: '#0EA5E9', soft: '#E8F7FE', Icon: Cloud },
  vpn: { key: 'vpn', label: 'VPN', accent: '#2563EB', soft: '#EAF3FF', Icon: ShieldCheck },
  email: { key: 'email', label: 'E-mail', accent: '#0F766E', soft: '#E7F7F5', Icon: Mail },
  code: { key: 'code', label: 'Developer', accent: '#7C3AED', soft: '#F0EAFF', Icon: Code2 },
  license: { key: 'license', label: 'License', accent: '#2563EB', soft: '#EAF3FF', Icon: KeyRound },
  'gpm-login': { key: 'gpm-login', label: 'GPMLogin', accent: '#0E7490', soft: '#E9F8FB', monogram: 'GPM' },
  'manychat': { key: 'manychat', label: 'ManyChat', accent: '#2563EB', soft: '#EEF4FF', domain: 'manychat.com', monogram: 'MC' },
  'metricool': { key: 'metricool', label: 'Metricool', accent: '#2563EB', soft: '#EEF4FF', domain: 'metricool.com', monogram: 'MT' },
  'sendpulse': { key: 'sendpulse', label: 'SendPulse', accent: '#2563EB', soft: '#EEF4FF', domain: 'sendpulse.com', monogram: 'SP' },
  'adspower': { key: 'adspower', label: 'AdsPower', accent: '#0E7490', soft: '#E9F8FB', domain: 'adspower.com', monogram: 'AP' },
  'multilogin': { key: 'multilogin', label: 'Multilogin', accent: '#7C3AED', soft: '#F1F0FF', domain: 'multilogin.com', monogram: 'ML' },
  'runway': { key: 'runway', label: 'Runway', accent: '#111827', soft: '#F1F5F9', domain: 'runwayml.com', monogram: 'RW' },
  'pika': { key: 'pika', label: 'Pika', accent: '#7C3AED', soft: '#F1F0FF', domain: 'pika.art', monogram: 'PK' },
  'discord': { key: 'discord', label: 'Discord', accent: '#5865F2', soft: '#EEF0FF', monogram: 'DC', asset: '/brand-icons/discord.svg' },
  'twitch': { key: 'twitch', label: 'Twitch', accent: '#9146FF', soft: '#F3EBFF', monogram: 'TW', asset: '/brand-icons/twitch.svg' },
  'epic-games': { key: 'epic-games', label: 'Epic Games', accent: '#111827', soft: '#F1F5F9', monogram: 'EP', asset: '/brand-icons/epic-games.svg' },
  'riot-games': { key: 'riot-games', label: 'Riot Games', accent: '#D82C30', soft: '#FFF0F0', monogram: 'RI', asset: '/brand-icons/riot-games.svg' },
  'league-of-legends': { key: 'league-of-legends', label: 'League of Legends', accent: '#D29C48', soft: '#FFF6E6', monogram: 'LOL', asset: '/brand-icons/league-of-legends.svg' },
  'pubg': { key: 'pubg', label: 'PUBG', accent: '#F3A712', soft: '#FFF7E0', monogram: 'PUBG', asset: '/brand-icons/pubg.svg' },
  'whatsapp': { key: 'whatsapp', label: 'WhatsApp', accent: '#25D366', soft: '#E8FAF0', monogram: 'WA', asset: '/brand-icons/whatsapp.svg' },
  'linkedin': { key: 'linkedin', label: 'LinkedIn', accent: '#0A66C2', soft: '#EAF4FF', domain: 'linkedin.com', monogram: 'in' },
  'pinterest': { key: 'pinterest', label: 'Pinterest', accent: '#BD081C', soft: '#FFF0F0', monogram: 'P', asset: '/brand-icons/pinterest.svg' },
  'snapchat': { key: 'snapchat', label: 'Snapchat', accent: '#B8A600', soft: '#FFFDE8', monogram: 'SC', asset: '/brand-icons/snapchat.svg' },
  'g2g': { key: 'g2g', label: 'G2G', accent: '#1D4ED8', soft: '#EEF4FF', domain: 'g2g.com', monogram: 'G2G' },
  generic: { key: 'generic', label: 'Digital', accent: '#1677FF', soft: '#EAF3FF', Icon: Package },
}

type DetectionInput = {
  name?: string | null
  category?: string | null
  icon?: string | null
}

// Generic products can show a category mark; brand matching stays exact.
function genericProductIcon(value: string): ProductIconKey | null {
  const text = value.toLocaleLowerCase()
  if (/vpn|прокси|\bproxy\b/.test(text)) return 'vpn'
  if (/gaming|тоглоом|network/.test(text)) return 'gaming'
  if (/хөгжим|audio|music/.test(text)) return 'music'
  if (/e-?mail|и-?мэйл/.test(text)) return 'email'
  if (/cloud|storage|үүлэн/.test(text)) return 'cloud'
  if (/developer|код|хөгжүүлэлт|coding/.test(text)) return 'code'
  if (/(?:^|[^\w])ai(?:$|[^\w])|хиймэл оюун/.test(text)) return 'ai'
  if (/программ|лиценз|software|license/.test(text)) return 'license'
  return null
}

const ICON_FALLBACKS: Record<string, ProductIconKey> = {
  Facebook: 'facebook',
  Instagram: 'instagram',
  Twitter: 'x',
  Send: 'telegram',
  Music2: 'music',
  Mail: 'email',
  Sparkles: 'ai',
}

function anonymousProductMark(name: string): ProductIconMeta {
  const words = name.match(/[\p{L}\p{N}]+/gu) || []
  const monogram = (words.length > 1
    ? words.slice(0, 2).map(word => Array.from(word)[0]).join('')
    : Array.from(words[0] || '?').slice(0, 2).join('')).toUpperCase()
  let hash = 0
  for (const char of name.toLowerCase()) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0
  const colors = ['#2563EB', '#7C3AED', '#0F766E', '#BE185D', '#B45309', '#4338CA']
  return { key: 'generic', label: name, accent: colors[hash % colors.length], soft: '#F1F5F9', monogram }
}

export function detectProductIcon(input: DetectionInput): ProductIconMeta {
  const name = (input.name || '').normalize('NFKC').replace(/[‐‑–—_]/g, ' ').replace(/\s+/g, ' ').trim()
  const category = (input.category || '').trim()
  const icon = input.icon || ''

  // "brand:" is an intentional admin override, unlike legacy generic icons.
  if (icon.startsWith('brand:')) {
    const selected = explicitProductBrand(icon.slice(6))
    if (selected && selected in META) return META[selected as ProductIconKey]
  }

  const namedGame = detectGameBrand({ name })
  const namedBrand = detectProductBrandName(name)
  if (namedGame === 'gaming' || namedBrand === 'generic') return anonymousProductMark(name || 'Digital')
  if (namedGame) return META[namedGame]
  if (namedBrand && namedBrand in META) return META[namedBrand as ProductIconKey]

  // Fallback for older product records and manual non-prefixed icon values.
  const legacyGame = detectGameBrand({ icon })
  if (legacyGame) return META[legacyGame]
  const chosen = explicitProductBrand(icon)
  if (chosen && chosen in META) return META[chosen as ProductIconKey]

  // Brand-specific categories cover anonymous titles like "1000 views" while
  // generic gaming/software categories never claim a specific brand.
  const categoryGame = detectGameBrand({ category })
  if (categoryGame) return META[categoryGame]
  const fromCategory = categoryProductBrand(category)
  if (fromCategory && fromCategory in META) return META[fromCategory as ProductIconKey]

  if (name) return anonymousProductMark(name)

  const genericKey = genericProductIcon(category)
  if (genericKey) return META[genericKey]
  const legacyFallback = ICON_FALLBACKS[icon]
  return META[legacyFallback || 'generic']
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
