import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site-url'
// Products currently open in modals; they do not have separate public URLs.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: siteUrl() + '/', changeFrequency: 'daily', priority: 1 }]
}
