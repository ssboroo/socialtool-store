import type { Metadata, Viewport } from 'next'
import { siteUrl } from '@/lib/site-url'
import { ThemeProvider } from '@/components/site/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'
import './store-font.css'
import './noto-font.css'
import './storefront.css'
import './store-design.css'
import './catalog-polish.css'
import './production-polish.css'
import './theme.css'
import './premium-storefront.css'
import './typography.css'
import './card-system.css'

const baseUrl = siteUrl()
const brandLogo = `${baseUrl}/socialtool-logo.png`

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'SOCIALTOOL.STORE — Social Media & AI Tools',
    template: '%s | SOCIALTOOL.STORE',
  },
  description: 'Social media, AI, automation болон marketing хэрэгслүүдийг нэг дороос аюулгүй, хурдан аваарай.',
  applicationName: 'SOCIALTOOL.STORE',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/socialtool-logo.png', type: 'image/png', sizes: '192x192' }],
    shortcut: '/socialtool-logo.png',
    apple: [{ url: '/socialtool-logo.png', type: 'image/png', sizes: '192x192' }],
  },
  openGraph: {
    type: 'website',
    siteName: 'SOCIALTOOL.STORE',
    title: 'SOCIALTOOL.STORE — Social Media & AI Tools',
    description: 'Social media, AI, automation болон marketing хэрэгслүүд нэг дор.',
    url: baseUrl,
    images: [{ url: '/socialtool-logo.png', width: 192, height: 192, alt: 'SOCIALTOOL.STORE logo' }],
  },
  twitter: {
    card: 'summary',
    title: 'SOCIALTOOL.STORE — Social Media & AI Tools',
    description: 'Social media, AI, automation болон marketing хэрэгслүүд нэг дор.',
    images: ['/socialtool-logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5F9FF' },
    { media: '(prefers-color-scheme: dark)', color: '#07111F' },
  ],
  colorScheme: 'light dark',
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'SOCIALTOOL.STORE',
  url: baseUrl,
  logo: brandLogo,
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'SOCIALTOOL.STORE',
  url: baseUrl,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="mn" suppressHydrationWarning>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  )
}
