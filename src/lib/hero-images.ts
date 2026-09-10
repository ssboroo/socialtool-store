export function heroImages(settings?: Record<string, string>): string[] {
  try { const images = JSON.parse(settings?.heroImages || 'null'); if (Array.isArray(images)) return images.filter((v): v is string => typeof v === 'string' && /^\/uploads\/products\/[A-Za-z0-9_-]+\.webp$/.test(v)).slice(0, 10) } catch {}
  return settings?.heroImage ? [settings.heroImage] : []
}
