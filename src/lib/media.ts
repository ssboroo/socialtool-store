/** Accept only known YouTube hosts and complete 11-character video IDs. */
export function getYouTubeId(value: string): string | null {
  const raw = value.trim()
  const valid = (id: string | null) => id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null
  if (valid(raw)) return raw
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
    if (!['http:', 'https:'].includes(url.protocol)) return null
    const host = url.hostname.toLowerCase().replace(/^www\./, '')
    const parts = url.pathname.split('/').filter(Boolean)
    if (host === 'youtu.be') return valid(parts[0] || null)
    if (!['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com'].includes(host)) return null
    if (url.pathname === '/watch') return valid(url.searchParams.get('v'))
    if (['embed', 'shorts', 'live', 'v'].includes(parts[0])) return valid(parts[1] || null)
  } catch { /* Invalid URL. */ }
  return null
}

export function getYouTubeThumb(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}

export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`
}

export function parseImageList(raw: string | null | undefined): string[] {
  if (!raw) return []
  return raw.split(/[;\n]/).map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s) || /^\/(?!\/)/.test(s))
}
