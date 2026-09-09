/** Extract a YouTube video id from various URL formats. Returns null if not found. */
export function getYouTubeId(url: string): string | null {
  if (!url) return null
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/v\/)([A-Za-z0-9_-]{11})/,
    /[?&]v=([A-Za-z0-9_-]{11})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  // bare 11-char id
  if (/^[A-Za-z0-9_-]{11}$/.test(url.trim())) return url.trim()
  return null
}

export function getYouTubeThumb(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}

export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`
}

/** Parse a semicolon-separated string of image URLs into an array. */
export function parseImageList(raw: string | null | undefined): string[] {
  if (!raw) return []
  return raw
    .split(/[;\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && /^https?:\/\//.test(s))
}
