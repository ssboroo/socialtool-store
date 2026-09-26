import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, existsSync } from 'node:fs'
import { detectProductBrandName, explicitProductBrand, categoryProductBrand, BRAND_ICON_OPTIONS } from '../src/lib/product-brand.ts'

const examples = [
  ['Adobe Photoshop 2026', 'photoshop'],
  ['Adobe Illustrator License', 'illustrator'],
  ['Adobe Premiere Pro', 'premiere'],
  ['Adobe After Effects', 'after-effects'],
  ['Adobe Lightroom', 'lightroom'],
  ['Adobe Acrobat Reader', 'acrobat'],
  ['Autodesk +46 Products', 'autodesk'],
  ['AutoCAD 2027 License', 'autodesk'],
  ['Microsoft Office 2027 Pro', 'office'],
  ['Microsoft 365 Family', 'office'],
  ['Microsoft Excel 2027', 'office'],
  ['Windows 11 Pro', 'windows'],
  ['Windows Server 2025', 'server'],
  ['Visual Studio 2026', 'visual-studio'],
  ['OneDrive 1 TB', 'onedrive'],
  ['Dropbox Pro', 'dropbox'],
  ['iCloud Plus', 'icloud'],
  ['Gmail Account', 'gmail'],
  ['Outlook Premium', 'outlook'],
  ['Google Drive 5 TB', 'drive'],
  ['Canva Pro 1 жил', 'canva'],
  ['CapCut Pro', 'capcut'],
  ['CorelDRAW Graphics', 'corel'],
  ['Figma Team', 'figma'],
  ['Notion AI Plan', 'notion'],
  ['Midjourney v8', 'midjourney'],
  ['ChatGPT Plus', 'openai'],
  ['OpenAI Sora subscription', 'openai'],
  ['Чат ЖПТ Pro', 'openai'],
  ['Claude Pro', 'claude'],
  ['Google AI Pro 18 months', 'gemini'],
  ['Gemini 3.8 Pro', 'gemini'],
  ['Google Flow credits', 'gemini'],
  ['NotebookLM Plus', 'gemini'],
  ['Grok Premium', 'grok'],
  ['Perplexity Pro', 'perplexity'],
  ['Cursor AI Pro', 'cursor'],
  ['Windsurf IDE', 'windsurf'],
  ['Lovable Pro', 'lovable'],
  ['Suno Studio', 'suno'],
  ['ElevenLabs Voice', 'elevenlabs'],
  ['RunwayML Gen Video', 'runway'],
  ['Pika Labs Pro', 'pika'],
  ['Instagram Reel Views', 'instagram'],
  ['IG Followers', 'instagram'],
  ['Инстаграм лайк', 'instagram'],
  ['Facebook 1,000 Live Stream Views /Global/', 'facebook'],
  ['Фэйсбүүк шинэ хаяг', 'facebook'],
  ['Tik Tok Views', 'tiktok'],
  ['TikTok Followers', 'tiktok'],
  ['Telegram Premium', 'telegram'],
  ['YouTube Subscribers', 'youtube'],
  ['YT views 5K', 'youtube'],
  ['WhatsApp Marketing', 'whatsapp'],
  ['LinkedIn Premium', 'linkedin'],
  ['Pinterest Business', 'pinterest'],
  ['Snapchat Plus', 'snapchat'],
  ['Discord Nitro', 'discord'],
  ['Twitch Followers', 'twitch'],
  ['Twitter X Premium', 'x'],
  ['X Blue', 'x'],
  ['MaxCare [ACTIVE]', 'maxcare'],
  ['MKT автоматжуулалтын бүх програм багц', 'mkt'],
  ['GPMLOGIN Antidetect', 'gpm-login'],
  ['ManyChat Messenger Bot', 'manychat'],
  ['Metricool Pro', 'metricool'],
  ['SendPulse Automation', 'sendpulse'],
  ['AdsPower Browser', 'adspower'],
  ['Multilogin Team', 'multilogin'],
  ['League of Legends Account', 'league-of-legends'],
  ['Riot Games Account', 'riot-games'],
  ['Epic Games Account', 'epic-games'],
  ['Steam Wallet', 'steam'],
  ['Minecraft Premium', 'minecraft'],
  ['Roblox Robux', 'roblox'],
  ['PUBG Mobile account', 'pubg'],
  ['Xbox Game Pass Ultimate', 'xbox'],
  ['PS5 Plus', 'playstation'],
  ['Nintendo Switch', 'nintendo'],
  ['GitHub Copilot', 'github'],
  ['GitLab Premium', 'gitlab'],
  ['NordVPN 1 year', 'nordvpn'],
  ['Surfshark VPN', 'surfshark'],
  ['ExpressVPN', 'expressvpn'],
  ['Proton VPN Plus', 'protonvpn'],
  ['Spotify Premium', 'spotify'],
  ['Netflix 4K', 'netflix'],
  ['Rakuten Premium', 'rakuten'],
  ['Rakuten Viki', 'viki'],
  ['FL Studio Producer', 'fl-studio'],
  ['Ableton Live Suite', 'ableton'],
]

test('common English, Mongolian and supplier catalog names map to the intended brand', () => {
  for (const [name, expected] of examples) {
    assert.equal(detectProductBrandName(name), expected, name)
  }
})

test('specific products override umbrella brands and neutral bundles do not claim a logo', () => {
  assert.equal(detectProductBrandName('Adobe Photoshop 2027'), 'photoshop')
  assert.equal(detectProductBrandName('Microsoft 365 OneDrive'), 'onedrive')
  assert.equal(detectProductBrandName('G2G Minecraft Account'), 'minecraft')
  assert.equal(detectProductBrandName('Facebook Instagram TikTok growth package'), 'generic')
  assert.equal(detectProductBrandName('Canva Pro + ChatGPT Plus'), 'generic')
  assert.equal(detectProductBrandName('CS2 & Discord Combo'), 'discord') // CS2 is handled by the separate game matcher.
  assert.equal(detectProductBrandName('MaxCare Facebook Account Manager'), 'maxcare')
  assert.equal(detectProductBrandName('MKT Facebook Instagram Automation'), 'mkt')
  assert.equal(detectProductBrandName('ManyChat for Facebook and Instagram'), 'manychat')
})

test('unknown brand names remain neutral instead of borrowing a competitor logo', () => {
  for (const name of [
    'Canvas UI widgets', 'JavaScript callback function', 'Telegrams from office',
    'Microsoft CSS templates', 'SunoMusic player', 'Zoomer Account',
    'Creative custom tool', 'DotaSaurus SDK', 'Unknown 1000 followers'
  ]) assert.equal(detectProductBrandName(name), null, name)
  assert.equal(categoryProductBrand('Facebook хэрэгсэл'), 'facebook')
  assert.equal(categoryProductBrand('Gaming & Network'), null)
  assert.equal(explicitProductBrand('figma'), 'figma')
  assert.equal(explicitProductBrand('GPMLogin'), 'gpm-login')
  assert.equal(explicitProductBrand('brand:figma'), null) // prefix is intentionally handled in the UI.
  assert.equal(explicitProductBrand('Package'), null)
})

test('every editable brand has a unique key and corresponding display metadata', () => {
  const iconCode = readFileSync(new URL('../src/components/site/product-icon.tsx', import.meta.url), 'utf8')
  assert.ok(BRAND_ICON_OPTIONS.length >= 80)
  assert.equal(new Set(BRAND_ICON_OPTIONS.map(item => item.value)).size, BRAND_ICON_OPTIONS.length)
  for (const item of BRAND_ICON_OPTIONS) {
    assert.ok(item.label.trim())
    assert.ok(iconCode.includes("key: '" + item.value + "'"), 'missing metadata: ' + item.value)
  }
})

test('all local SVGs referenced by the display metadata exist and are safe XML', () => {
  const iconCode = readFileSync(new URL('../src/components/site/product-icon.tsx', import.meta.url), 'utf8')
  const names = [...iconCode.matchAll(/asset: '\/brand-icons\/([^']+\.svg)'/g)].map(match => match[1])
  assert.ok(names.length >= 45, 'Too few independently hosted brand icons')
  for (const name of names) {
    const path = new URL('../public/brand-icons/' + name, import.meta.url)
    assert.ok(existsSync(path), 'missing logo file: ' + name)
    const source = readFileSync(path, 'utf8')
    assert.match(source, /<svg\b/, name)
    assert.doesNotMatch(source, /<(script|image|foreignObject)\b/i, name)
  }
})
