import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SOCIALTOOL.STORE',
    short_name: 'SOCIALTOOL',
    description: 'Social media, AI, automation болон marketing хэрэгслүүд нэг дор.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F5F9FF',
    theme_color: '#1677FF',
    icons: [
      {
        src: '/socialtool-logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
