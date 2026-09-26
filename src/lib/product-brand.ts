/**
 * Product name → brand lookup.
 *
 * Only match complete words/phrases to avoid showing a competitor's logo
 * because of a substring in an unrelated name. Product images supplied by
 * the merchant always take priority in the image component.
 *
 * The map is deliberately data-only and framework-free for node tests.
 */
const ALIASES = [
  // Specific product lines before their parent suites/companies.
  ['photoshop', 'Photoshop', ['photoshop', 'фотошоп']],
  ['illustrator', 'Illustrator', ['illustrator', 'adobe illustrator']],
  ['premiere', 'Premiere Pro', ['premiere pro', 'adobe premiere', 'premiere']],
  ['after-effects', 'After Effects', ['after effects', 'aftereffects', 'афтер эффект']],
  ['lightroom', 'Lightroom', ['lightroom', 'лайтрум']],
  ['acrobat', 'Acrobat', ['acrobat', 'adobe pdf']],
  ['onedrive', 'OneDrive', ['onedrive', 'one drive', 'ван драйв']],
  ['outlook', 'Outlook', ['outlook', 'hotmail', 'hotmail com']],
  ['gmail', 'Gmail', ['gmail', 'жи мэйл', 'жмэйл']],
  ['drive', 'Google Drive', ['google drive', 'гугл драйв']],
  ['icloud', 'iCloud', ['icloud', 'айклауд']],
  ['dropbox', 'Dropbox', ['dropbox']],
  ['visual-studio', 'Visual Studio', ['visual studio', 'визуал студио']],
  ['office', 'Microsoft Office', ['microsoft 365', 'microsoft office', 'office 365', 'office 2027', 'office 2026', 'office 2025', 'office 2024', 'office 2023', 'office 2022', 'office 2021', 'office 2019', 'office 2016', 'ms office', 'microsoft excel', 'microsoft word', 'microsoft powerpoint', 'ms excel', 'ms word', 'powerpoint', 'power point', 'excel 2027', 'excel 2026', 'word 2027', 'word 2026', 'оффис 365', 'майкрософт оффис']],
  ['server', 'Windows Server', ['windows server', 'виндовс сервер']],
  ['windows', 'Windows', ['windows 7', 'windows 8', 'windows 10', 'windows 11', 'windows pro', 'windows home', 'windows enterprise', 'windows key', 'windows license', 'windows activation', 'виндовс', 'виндоус']],
  ['autodesk', 'Autodesk', ['autodesk', 'autocad', 'auto cad', 'revit', '3ds max', 'fusion 360', 'inventor', 'navisworks', 'maya', 'cad 2027', 'autodesk 46']],
  ['corel', 'CorelDRAW', ['coreldraw', 'corel draw', 'corel']],
  ['capcut', 'CapCut', ['capcut', 'cap cut', 'капкат']],
  ['canva', 'Canva', ['canva', 'канва']],
  ['figma', 'Figma', ['figma', 'фигма']],
  ['adobe', 'Adobe', ['adobe', 'адоби']],
  // AI tools: named software before generic Gemini/AI groupings.
  ['openai', 'ChatGPT / OpenAI', ['chatgpt', 'chat gpt', 'чатгпт', 'чат жпт', 'openai', 'open ai', 'gpt plus', 'gpt pro', 'gpt 5', 'gpt 6', 'sora']],
  ['claude', 'Claude', ['claude', 'клод', 'клоуд ai']],
  ['gemini', 'Google Gemini', ['gemini', 'gemini pro', 'google ai', 'google one ai', 'google flow', 'google vids', 'notebooklm', 'notebook lm', 'гугл ай', 'жемини', 'джемини', 'veo 3', 'veo 4']],
  ['grok', 'Grok', ['grok', 'грок']],
  ['perplexity', 'Perplexity', ['perplexity', 'перплексити']],
  ['cursor', 'Cursor', ['cursor ai', 'cursor pro', 'cursor editor', 'cursor']],
  ['windsurf', 'Windsurf', ['windsurf', 'виндсерф']],
  ['lovable', 'Lovable', ['lovable', 'loveable']],
  ['midjourney', 'Midjourney', ['midjourney', 'mid journey', 'миджорни']],
  ['suno', 'Suno', ['suno', 'суно']],
  ['elevenlabs', 'ElevenLabs', ['elevenlabs', 'eleven labs', 'элевен лабс']],
  ['runway', 'Runway', ['runway ml', 'runway ai', 'runway gen', 'runwayml', 'runway']],
  ['pika', 'Pika', ['pika labs', 'pika ai', 'pika art']],
  ['notion', 'Notion', ['notion', 'ноушн']],
  ['grammarly', 'Grammarly', ['grammarly', 'граммарли']],
  ['zoom', 'Zoom', ['zoom meetings', 'zoom pro', 'zoom meeting', 'zoom']],
  // Social networks, first-party platforms and their Mongolian names.
  ['instagram', 'Instagram', ['instagram', 'insta gram', 'инстаграм', 'инста', 'ig followers', 'ig likes', 'ig views', 'ig accounts']],
  ['facebook', 'Facebook', ['facebook', 'фэйсбүүк', 'фейсбүүк', 'фейсбук', 'фэйсбук', 'fb followers', 'fb likes', 'fb accounts', 'fb views', 'meta business suite', 'meta verified', 'meta ads manager']],
  ['tiktok', 'TikTok', ['tiktok', 'tik tok', 'тик ток', 'тикток']],
  ['telegram', 'Telegram', ['telegram', 'телеграм', 'тэлэграм']],
  ['youtube', 'YouTube', ['youtube', 'you tube', 'ютуб', 'юүтүб', 'yt subscribers', 'yt views', 'yt channel']],
  ['whatsapp', 'WhatsApp', ['whatsapp', 'whats app', 'ватсап', 'ватсапп']],
  ['linkedin', 'LinkedIn', ['linkedin', 'линкедин']],
  ['pinterest', 'Pinterest', ['pinterest', 'пинтерест']],
  ['snapchat', 'Snapchat', ['snapchat', 'снапчат']],
  ['discord', 'Discord', ['discord', 'дискорд']],
  ['twitch', 'Twitch', ['twitch', 'твич']],
  ['x', 'X / Twitter', ['twitter', 'твиттер', 'x premium', 'x blue', 'x followers', 'x account', 'x verified']],
  // Third-party tools must win over the social platform they integrate with.
  ['maxcare', 'MaxCare', ['maxcare', 'max care', 'maxcare active']],
  ['mkt', 'MKT', ['mkt', 'mkt automation', 'mkt care']],
  ['gpm-login', 'GPMLogin', ['gpmlogin', 'gpm login', 'gpm login browser', 'gpm login pro']],
  ['manychat', 'ManyChat', ['manychat', 'many chat', 'мэничат']],
  ['metricool', 'Metricool', ['metricool', 'метрикүүл']],
  ['sendpulse', 'SendPulse', ['sendpulse', 'send pulse']],
  ['adspower', 'AdsPower', ['adspower', 'ads power']],
  ['multilogin', 'Multilogin', ['multilogin', 'multi login browser']],
  // Gaming stores and games. CS/Valorant/Dota have their own stronger matcher.
  ['league-of-legends', 'League of Legends', ['league of legends', 'leagueoflegends', 'лол аккаунт']],
  ['riot-games', 'Riot Games', ['riot games', 'riotgames', 'riot points']],
  ['epic-games', 'Epic Games', ['epic games', 'epicgames']],
  ['steam', 'Steam', ['steam', 'стийм']],
  ['minecraft', 'Minecraft', ['minecraft', 'майнкрафт']],
  ['roblox', 'Roblox', ['roblox', 'роблокс']],
  ['pubg', 'PUBG', ['pubg', 'пабжи']],
  ['xbox', 'Xbox', ['xbox', 'game pass', 'иксбокс']],
  ['playstation', 'PlayStation', ['playstation', 'play station', 'psn account', 'ps plus', 'ps5', 'ps4', 'плейстэйшн']],
  ['nintendo', 'Nintendo', ['nintendo', 'нинтендо']],
  ['g2g', 'G2G', ['g2g accounts', 'g2g marketplace', 'g2g']],
  // Work, security and entertainment.
  ['github', 'GitHub', ['github', 'гитхаб']],
  ['gitlab', 'GitLab', ['gitlab']],
  ['nordvpn', 'NordVPN', ['nordvpn', 'nord vpn']],
  ['surfshark', 'Surfshark', ['surfshark', 'surf shark']],
  ['expressvpn', 'ExpressVPN', ['expressvpn', 'express vpn']],
  ['protonvpn', 'ProtonVPN', ['protonvpn', 'proton vpn']],
  ['spotify', 'Spotify', ['spotify', 'спотифай']],
  ['netflix', 'Netflix', ['netflix', 'нетфликс']],
  ['rakuten', 'Rakuten', ['rakuten']],
  ['viki', 'Viki', ['viki', 'rakuten viki']],
  ['fl-studio', 'FL Studio', ['fl studio', 'flstudio', 'image line studio']],
  ['ableton', 'Ableton', ['ableton', 'ableton live']],
] as const

export type RecognizedBrand = typeof ALIASES[number][0]

export const BRAND_ICON_OPTIONS: ReadonlyArray<{ value: RecognizedBrand; label: string }> =
  ALIASES.map(([value, label]) => ({ value, label }))

function normalize(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('en-US')
    .replace(/[‐‑‒–—―_]/g, '-')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ').trim()
}

function matchBrands(name: string) {
  const source = ' ' + normalize(name) + ' '
  if (!source.trim()) return []
  const results: Array<{ key: RecognizedBrand; index: number; size: number }> = []
  for (const [key, , aliases] of ALIASES) {
    let first = Infinity
    let longest = 0
    for (const alias of aliases) {
      const token = ' ' + normalize(alias) + ' '
      const index = source.indexOf(token)
      if (index >= 0 && (index < first || (index === first && token.length > longest))) {
        first = index
        longest = token.length
      }
    }
    if (Number.isFinite(first)) results.push({ key, index: first, size: longest })
  }
  return results
}

const SPECIFIC_ADOBE = new Set<string>(['photoshop','illustrator','premiere','after-effects','lightroom','acrobat'])
const SPECIFIC_MICROSOFT = new Set<string>(['onedrive','outlook','visual-studio','server'])
const SPECIFIC_GAMES = new Set<string>(['league-of-legends'])
const SOCIAL_KEYS = new Set<string>(['facebook','instagram','tiktok','telegram','youtube','whatsapp','linkedin','pinterest','snapchat','x'])

/** Return a known key, the neutral "generic" key for a mixed-brand bundle, or null. */
export function detectProductBrandName(name?: string | null): RecognizedBrand | 'generic' | null {
  if (!name?.trim()) return null
  let matches = matchBrands(name)
  if (!matches.length) return null

  // Publisher/umbrella names must not obscure their specifically named products.
  if (matches.some(m => SPECIFIC_ADOBE.has(m.key))) matches = matches.filter(m => m.key !== 'adobe')
  if (matches.some(m => SPECIFIC_MICROSOFT.has(m.key))) matches = matches.filter(m => m.key !== 'office')
  if (matches.some(m => SPECIFIC_GAMES.has(m.key))) matches = matches.filter(m => m.key !== 'riot-games')
  if (matches.some(m => m.key === 'viki')) matches = matches.filter(m => m.key !== 'rakuten')
  if (matches.length > 1) matches = matches.filter(m => m.key !== 'g2g')
  if (matches.some(m => ['maxcare','mkt','manychat','metricool','gpm-login','sendpulse','adspower','multilogin'].includes(m.key))) {
    matches = matches.filter(m => !SOCIAL_KEYS.has(m.key))
  }

  // Ads offering two distinct platforms/games should not wear a single logo.
  const distinct = new Set(matches.map(m => m.key))
  const socialCount = matches.filter(m => SOCIAL_KEYS.has(m.key)).length
  if (distinct.size >= 2 && (socialCount >= 2 || /(?:\+|&|,|\s\/\s|\sболон\s|\sand\s|\bcombo\b|\bbundle\b)/i.test(name))) {
    return 'generic'
  }

  matches.sort((a, b) => a.index - b.index || b.size - a.size)
  return matches[0]?.key || null
}

export function explicitProductBrand(icon?: string | null): RecognizedBrand | null {
  if (!icon?.trim()) return null
  const normalized = normalize(icon)
  const exact = ALIASES.find(([key, label]) => normalize(key) === normalized || normalize(label) === normalized)
  return exact?.[0] || null
}

/** Category fallback is only used after checking name and explicit admin selection. */
export function categoryProductBrand(category?: string | null): RecognizedBrand | null {
  const detected = detectProductBrandName(category)
  return detected && detected !== 'generic' ? detected : null
}
