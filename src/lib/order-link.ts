/** Customer-provided destination for post/live/video engagement orders. */
export function isValidOrderLink(value: string): boolean {
  const link = value.trim()
  if (!link || link.length > 2048) return false
  try {
    const url = new URL(link)
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password
  } catch {
    return false
  }
}
