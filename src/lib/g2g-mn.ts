const EXACT: Record<string, string> = {
  'Gift Cards': 'Бэлгийн карт',
  'Gift Card': 'Бэлгийн карт',
  'Accounts': 'Аккаунт',
  'Account': 'Аккаунт',
  'Software': 'Программ',
  'Software & Apps': 'Программ & Апп',
  'Social Media': 'Сошиал медиа',
  'Direct Top Up': 'Шууд цэнэглэлт',
  'Direct top up': 'Шууд цэнэглэлт',
  'Top Up': 'Цэнэглэлт',
  'Game Coins': 'Тоглоомын валют',
  'Items': 'Тоглоомын эд зүйл',
  'Boosting': 'Түвшин ахиулах үйлчилгээ',
  'Coaching': 'Сургалт',
  'Global': 'Олон улсын',
  'Worldwide': 'Олон улсын',
  'United States': 'АНУ',
  'United Kingdom': 'Их Британи',
  'Europe': 'Европ',
  'Japan': 'Япон',
  'South Korea': 'Өмнөд Солонгос',
  'Korea': 'Солонгос',
  'Singapore': 'Сингапур',
  'Malaysia': 'Малайз',
  'Indonesia': 'Индонез',
  'Philippines': 'Филиппин',
  'Thailand': 'Тайланд',
  'Vietnam': 'Вьетнам',
  'Turkey': 'Турк',
  'India': 'Энэтхэг',
  'Russia': 'Орос',
  'Brazil': 'Бразил',
}

const REGION: Record<string, string> = {
  global: 'Олон улсын',
  worldwide: 'Олон улсын',
  us: 'АНУ',
  usa: 'АНУ',
  uk: 'Их Британи',
  eu: 'Европ',
  jp: 'Япон',
  kr: 'Өмнөд Солонгос',
  sg: 'Сингапур',
  my: 'Малайз',
  id: 'Индонез',
  ph: 'Филиппин',
  th: 'Тайланд',
  vn: 'Вьетнам',
  tr: 'Турк',
  in: 'Энэтхэг',
  ru: 'Орос',
  br: 'Бразил',
  latam: 'Латин Америк',
}

export function translateG2GRegionMn(value?: string | null) {
  const raw = (value || '').trim()
  if (!raw) return ''
  return REGION[raw.toLowerCase()] || EXACT[raw] || raw
}

function translateCommon(input: string) {
  let value = input.trim()
  if (!value) return value
  if (EXACT[value]) return EXACT[value]

  value = value
    .replace(/\bOld Account\b/gi, 'хуучин аккаунт')
    .replace(/\bNew Account\b/gi, 'шинэ аккаунт')
    .replace(/\bFollowers Account\b/gi, 'дагагчтай аккаунт')
    .replace(/\bFollower Account\b/gi, 'дагагчтай аккаунт')
    .replace(/\bBusiness Manager\b/gi, 'Business Manager')
    .replace(/\bLive Access\b/gi, 'LIVE эрхтэй')
    .replace(/\bAgency AD Account\b/gi, 'Agency зар сурталчилгааны аккаунт')
    .replace(/\bShop Account\b/gi, 'Shop аккаунт')
    .replace(/\bPage Likes\b/gi, 'Page лайк')
    .replace(/\bLive Stream Views\b/gi, 'Live үзэлт')
    .replace(/\bViews\b/gi, 'үзэлт')
    .replace(/\bComments\b/gi, 'сэтгэгдэл')
    .replace(/\bEvent Interested\b/gi, 'Event сонирхогч')
    .replace(/\bEvent Attendees\b/gi, 'Event оролцогч')
    .replace(/\bLifetime\b/gi, 'Хугацаагүй')
    .replace(/\bYears?\b/gi, 'жил')
    .replace(/\bMonths?\b/gi, 'сар')
    .replace(/\bDays?\b/gi, 'хоног')
    .replace(/\bLicense\b/gi, 'лиценз')
    .replace(/\bSubscription\b/gi, 'эрх')
    .replace(/\bPremium\b/gi, 'Premium')
    .replace(/\bGlobal\b/gi, 'Олон улсын')
    .replace(/\bWorldwide\b/gi, 'Олон улсын')

  value = value.replace(/\(([^)]+)\)/g, (_match, region: string) => {
    const translated = translateG2GRegionMn(region)
    return translated === region ? `(${region})` : `(${translated})`
  })

  return value.replace(/\s+/g, ' ').trim()
}

export function translateG2GTextMn(value?: string | null) {
  const raw = (value || '').trim()
  if (!raw) return ''
  return raw
    .split(/\s*>\s*/)
    .map(part => EXACT[part] || translateCommon(part))
    .join(' › ')
}

export function translateG2GProductNameMn(value?: string | null) {
  const raw = (value || '').trim()
  if (!raw) return ''

  const oldMatch = raw.match(/^(\d{4})\s+(.+?)\s+Old Account(?:\s+\(([^)]+)\))?$/i)
  if (oldMatch) {
    const [, year, platform, region] = oldMatch
    return `${platform} ${year} оны хуучин аккаунт${region ? ` — ${translateG2GRegionMn(region)}` : ''}`
  }

  const followersMatch = raw.match(/^(.+?)\s+([\d,]+)\+?\s+Followers Account(?:\s+\(([^)]+)\))?$/i)
  if (followersMatch) {
    const [, platform, count, region] = followersMatch
    return `${platform} ${count} дагагчтай аккаунт${region ? ` — ${translateG2GRegionMn(region)}` : ''}`
  }

  return translateG2GTextMn(raw)
}

export function g2gMongolianShortDescription(input: {
  brandName?: string | null
  serviceName?: string | null
  regionName?: string | null
}) {
  const brand = (input.brandName || '').trim()
  const service = translateG2GTextMn(input.serviceName)
  const region = translateG2GRegionMn(input.regionName)
  return [brand, service, region ? `Бүс: ${region}` : ''].filter(Boolean).join(' · ')
}
