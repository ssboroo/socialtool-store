import { db } from '@/lib/db'
import { Header } from '@/components/site/header'
import { Categories } from '@/components/site/categories'
import { SupportSection } from '@/components/site/support-section'
import { Hero } from '@/components/site/hero'
import { FeaturedProducts } from '@/components/site/featured-products'
import { WhyChooseUs } from '@/components/site/why-choose-us'
import { HowItWorks } from '@/components/site/how-it-works'
import { PromoBanner } from '@/components/site/promo-banner'
import { Reviews } from '@/components/site/reviews'
import { Faq } from '@/components/site/faq'
import { Footer } from '@/components/site/footer'
import { CartDrawer } from '@/components/site/cart-drawer'
import { CheckoutModal } from '@/components/site/checkout-modal'
import { LiveChat } from '@/components/site/live-chat'
import { AuthGate } from '@/components/site/auth-gate'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const now = new Date()
  const [categories, products, reviews, faqRows, settingsRows, promotion] = await Promise.all([
    db.category.findMany({ orderBy: { order: 'asc' } }),
    db.product.findMany({ orderBy: [{ featured: 'desc' }, { rating: 'desc' }] }),
    db.review.findMany({ orderBy: { createdAt: 'desc' } }),
    db.faq.findMany({ orderBy: { order: 'asc' } }),
    db.siteSetting.findMany(),
    db.promotion.findFirst({ where: { active: true, startAt: { lte: now }, endAt: { gte: now } }, orderBy: { createdAt: 'desc' } }),
  ])

  const settings: Record<string, string> = {}
  for (const s of settingsRows) settings[s.key] = s.value

  const serializedProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    shortDesc: p.shortDesc,
    description: p.description,
    price: p.price,
    oldPrice: p.oldPrice,
    discount: p.discount,
    icon: p.icon,
    image: p.image,
    category: p.category,
    rating: p.rating,
    reviewCount: p.reviewCount,
    available: p.available,
    features: p.features,
    duration: p.duration,
    tutorialVideoUrl: p.tutorialVideoUrl,
    instructionImages: p.instructionImages,
  }))

  const serializedCategories = categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, icon: c.icon, description: c.description, order: c.order }))
  const serializedFaqs = faqRows.map((f) => ({ id: f.id, q: f.question, a: f.answer }))
  const serializedPromo = promotion ? { title: promotion.title, description: promotion.description, badgeText: promotion.badgeText, discountPercent: promotion.discountPercent, endAt: promotion.endAt.toISOString() } : null

  return (
    <div className="storefront relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero settings={settings} />
        <FeaturedProducts categories={serializedCategories} initialProducts={serializedProducts} />
        <SupportSection settings={settings} />
        <PromoBanner promotion={serializedPromo} settings={settings} />
        <Categories categories={serializedCategories} />
        <WhyChooseUs />
        <HowItWorks />
        <Reviews reviews={reviews.map((r) => ({ id: r.id, name: r.name, role: r.role, rating: r.rating, content: r.content }))} />
        <Faq faqs={serializedFaqs} />
      </main>
      <Footer settings={settings} />
      <CartDrawer />
      <CheckoutModal />
      <LiveChat />
      <AuthGate />
    </div>
  )
}
