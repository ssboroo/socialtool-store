export function siteUrl() {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://socialtool.store')
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid site URL')
    return url.origin
  } catch { return 'https://socialtool.store' }
}
