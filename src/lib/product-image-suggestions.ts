const themes = [
  { id: 'instagram', label: 'Instagram', words: ['instagram', 'инстаграм'] },
  { id: 'facebook', label: 'Facebook', words: ['facebook', 'maxcare', 'фэйсбүүк'] },
  { id: 'tiktok', label: 'TikTok', words: ['tiktok'] },
  { id: 'twitter', label: 'X / Twitter', words: ['twitter', 'x хэрэгсэл'] },
  { id: 'windows', label: 'Windows', words: ['windows', 'лиценз'] },
  { id: 'office', label: 'Office', words: ['office', 'microsoft 365'] },
  { id: 'adobe', label: 'Дизайн ба видео', words: ['adobe', 'capcut', 'canva', 'дизайн', 'видео'] },
  { id: 'vpn', label: 'Аюулгүй байдал', words: ['vpn', 'security', 'аюулгүй'] },
  { id: 'ai', label: 'Хиймэл оюун', words: ['claude', 'google ai', 'chatgpt', 'gemini', 'ai', 'хиймэл'] },
  { id: 'generic', label: 'Дижитал хэрэгсэл', words: [] },
]
export function productImageSuggestions(name: string, category = '') {
  const match = (value: string) => themes.find(t => t.words.some(word => value.toLowerCase().includes(word)))
  const first = match(name) || match(category) || themes[themes.length - 1]
  return [first, ...themes.filter(t => t.id !== first.id && ['generic', 'ai', 'adobe'].includes(t.id))].slice(0, 4).map(t => ({ label: t.label, image: `/products/default/${t.id}.svg` }))
}
export function suggestProductImage(name: string, category = '') {
  return productImageSuggestions(name, category)[0].image
}
