import { db } from '@/lib/db'
import { Header } from '@/components/site/header'
import { Hero } from '@/components/site/hero'
import { Categories } from '@/components/site/categories'
import { FeaturedProducts } from '@/components/site/featured-products'
import { WhyChooseUs } from '@/components/site/why-choose-us'
import { HowItWorks } from '@/components/site/how-it-works'
import { PromoBanner } from '@/components/site/promo-banner'
import { Reviews } from '@/components/site/reviews'
import { Faq } from '@/components/site/faq'
import { Footer } from '@/components/site/footer'
import { CartDrawer } from '@/components/site/cart-drawer'
import { ProductDetailModal } from '@/components/site/product-detail-modal'
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
    db.promotion.findFirst({
      where: { active: true, startAt: { lte: now }, endAt: { gte: now } },
      orderBy: { createdAt: 'desc' },
    }),
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

  const serializedCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    description: c.description,
    order: c.order,
  }))

  const serializedFaqs = faqRows.map((f) => ({ id: f.id, q: f.question, a: f.answer }))
  const serializedPromo = promotion
    ? { title: promotion.title, description: promotion.description, badgeText: promotion.badgeText, discountPercent: promotion.discountPercent, endAt: promotion.endAt.toISOString() }
    : null

  return (
    <div className="relative min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Hero settings={settings} />
        <Categories categories={serializedCategories} />
        <FeaturedProducts categories={serializedCategories} initialProducts={serializedProducts} />
        <PromoBanner promotion={serializedPromo} settings={settings} />
        <WhyChooseUs />
        <HowItWorks />
        <Reviews reviews={reviews.map((r) => ({ id: r.id, name: r.name, role: r.role, rating: r.rating, content: r.content }))} />
        <Faq faqs={serializedFaqs} />
      </main>
      <Footer settings={settings} />

      {/* overlays */}
      <CartDrawer />
      <ProductDetailModal />
      <CheckoutModal />
      <LiveChat />
      <AuthGate />
    </div>
  )
}
