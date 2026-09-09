import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

const categories = [
  { name: 'Facebook Tool', slug: 'facebook', icon: 'Facebook', description: 'Facebook хуудас, бүлэг, аккаунт удирдлага', order: 1 },
  { name: 'TikTok Tool', slug: 'tiktok', icon: 'Music2', description: 'TikTok видео, үзэлт, оропын өсөлт', order: 2 },
  { name: 'Instagram Tool', slug: 'instagram', icon: 'Instagram', description: 'Instagram автоматжуулалт, өсөлт', order: 3 },
  { name: 'Twitter/X Tool', slug: 'twitter', icon: 'Twitter', description: 'Twitter/X пост, дагагч, автоматжуулалт', order: 4 },
  { name: 'Telegram Tool', slug: 'telegram', icon: 'Send', description: 'Telegram бот, масс мессеж, сувгийн удирдлага', order: 5 },
  { name: 'Email Tool', slug: 'email', icon: 'Mail', description: 'И-мэйл маркетинг, масс илгээлт', order: 6 },
  { name: 'AI Tool', slug: 'ai', icon: 'Sparkles', description: 'AI контент, дүрслэл, автоматжуулалт', order: 7 },
  { name: 'Бүх хэрэгсэл', slug: 'all', icon: 'LayoutGrid', description: 'Бүх төрлийн хэрэгсэл нэг дор', order: 8 },
]

const products = [
  {
    name: 'Facebook Account Manager Pro',
    slug: 'facebook-account-manager-pro',
    shortDesc: 'Олон аккаунтыг нэг панелаас аюулгүй удирдах',
    description: 'Facebook Account Manager Pro нь олон Facebook аккаунтыг нэг удирдлагын самбараас аюулгүй удирдах боломжийг олгоно. Cookie нэвтрэлт, пост товших, бүлэгт мессеж илгээх, найзын хүсэлт автомат хүлээж авах зэрэг олон функцээр тоноглогдсон. Банкны эрсдэлгүй anti-detect хамгаалалттай.',
    price: 89000,
    oldPrice: 120000,
    icon: 'Facebook',
    category: 'Facebook Tool',
    categorySlug: 'facebook',
    featured: true,
    rating: 4.9,
    reviewCount: 128,
    features: 'Cookie нэвтрэлт;Олон аккаунт удирдлага;Пост товших;Anti-detect хамгаалалт',
  },
  {
    name: 'Facebook Group Mass Poster',
    slug: 'facebook-group-mass-poster',
    shortDesc: 'Бүх бүлэгт нэг цагийн пост хийх',
    description: 'Facebook Group Mass Poster нь хэрэглэгчийн бүх бүлэгт нэгэн зэрэг пост оруулах автоматжуулсан хэрэгсэл. Цагийн хуваарьтай пост, зураг болон линк оруулга, анти-спам интервал тохиргоотой.',
    price: 65000,
    oldPrice: null,
    icon: 'Facebook',
    category: 'Facebook Tool',
    categorySlug: 'facebook',
    featured: false,
    rating: 4.7,
    reviewCount: 64,
    features: 'Цагийн хуваарь;Анти-спам интервал;Зураг/линк оруулга',
  },
  {
    name: 'TikTok Growth Toolkit',
    slug: 'tiktok-growth-toolkit',
    shortDesc: 'Үзэлт, лайк, дагагчийн бодит өсөлт',
    description: 'TikTok Growth Toolkit нь TikTok контентын үзэлт, лайк, дагагчийн тоог бодит хэрэглэгчид дээр тулгуурлан өсгөх цогц хэрэгсэл. Hashtag анализатор, хамгийн сайн цагийн зөвлөмж, видео тренд шинжилгээний модультай.',
    price: 75000,
    oldPrice: 95000,
    icon: 'Music2',
    category: 'TikTok Tool',
    categorySlug: 'tiktok',
    featured: true,
    rating: 4.8,
    reviewCount: 96,
    features: 'Үзэлт өсгөх;Hashtag анализатор;Тренд шинжилгээ;Цагийн зөвлөмж',
  },
  {
    name: 'TikTok Auto Comment Bot',
    slug: 'tiktok-auto-comment-bot',
    shortDesc: 'Бүх видео дээр автомат сэтгэгдэл',
    description: 'TikTok Auto Comment Bot нь зорилтот видео дээр автомат сэтгэгдэл үлдээх, хариулт өгөх функцтэй. Spin текст дэмжлэгтэй, интервал тохируулга, олон аккаунтын дараалалтай.',
    price: 58000,
    oldPrice: null,
    icon: 'Music2',
    category: 'TikTok Tool',
    categorySlug: 'tiktok',
    featured: false,
    rating: 4.6,
    reviewCount: 41,
    features: 'Spin текст;Интервал тохируулга;Олон аккаунт',
  },
  {
    name: 'Instagram Automation Tool',
    slug: 'instagram-automation-tool',
    shortDesc: 'Лайк, дагагч, мессеж автоматжуулалт',
    description: 'Instagram Automation Tool нь лайк, дагагч хайх, DM мессеж илгээх, стори үзэх зэрэг үйлдлийг автоматжуулна. Зорилтот бүлэг сонгох, хязгаар тохируулах, прокси дэмжлэгтэй.',
    price: 72000,
    oldPrice: 99000,
    icon: 'Instagram',
    category: 'Instagram Tool',
    categorySlug: 'instagram',
    featured: true,
    rating: 4.8,
    reviewCount: 112,
    features: 'Лайк/дагагч автомат;DM мессеж;Зорилтот бүлэг;Прокси дэмжлэг',
  },
  {
    name: 'Instagram Story Downloader Pro',
    slug: 'instagram-story-downloader-pro',
    shortDesc: 'Стори, Reels-ийг өндөр чанартай татаж авах',
    description: 'Instagram Story Downloader Pro нь хэрэглэгчийн стори, Reels, постыг өндөр чанартай татаж авах боломжтой. Багц татаж авах, гарчиг нэмэхгүй формат, видео/зураг шууд татах функцтэй.',
    price: 45000,
    oldPrice: null,
    icon: 'Instagram',
    category: 'Instagram Tool',
    categorySlug: 'instagram',
    featured: false,
    rating: 4.7,
    reviewCount: 53,
    features: 'Багц татах;HD чанар;Видео/зураг татах',
  },
  {
    name: 'Twitter/X Mass Engagement',
    slug: 'twitter-mass-engagement',
    shortDesc: 'Жиргээ, RT, лайк автоматжуулалт',
    description: 'Twitter/X Mass Engagement нь зорилтот жиргээнд лайк, RT, хариулт өгөх автоматжуулсан хэрэгсэл. Keyword мониторинг, олон аккаунтын зэрэгцэл, интервал тохиргоотой.',
    price: 68000,
    oldPrice: 85000,
    icon: 'Twitter',
    category: 'Twitter/X Tool',
    categorySlug: 'twitter',
    featured: false,
    rating: 4.6,
    reviewCount: 38,
    features: 'Keyword мониторинг;RT/лайк автомат;Олон аккаунт',
  },
  {
    name: 'Telegram Marketing Bot',
    slug: 'telegram-marketing-bot',
    shortDesc: 'Масс мессеж, сувгийн автоматжуулалт',
    description: 'Telegram Marketing Bot нь масс мессеж илгээх, сувагт автомат постлах, гишүүн удирдах зэрэг олон функцтэй. Scraping, филтер, интервал, прокси дэмжлэгтэй. Хууль ёсны маркетингт зориулагдсан.',
    price: 95000,
    oldPrice: 130000,
    icon: 'Send',
    category: 'Telegram Tool',
    categorySlug: 'telegram',
    featured: true,
    rating: 4.9,
    reviewCount: 156,
    features: 'Масс мессеж;Сувгийн постлах;Гишүүн удирдлага;Scraping дэмжлэг',
  },
  {
    name: 'Telegram Group Scraper',
    slug: 'telegram-group-scraper',
    shortDesc: 'Сувгаас гишүүний мэдээлэл татах',
    description: 'Telegram Group Scraper нь нийтийн сувгаас гишүүдийн нэр, утас, ID-г татаж авах хэрэгсэл. Филтер, давхардалтыг арилгах, CSV экспорт хийх боломжтой.',
    price: 52000,
    oldPrice: null,
    icon: 'Send',
    category: 'Telegram Tool',
    categorySlug: 'telegram',
    featured: false,
    rating: 4.5,
    reviewCount: 47,
    features: 'Гишүүн татах;Филтер;CSV экспорт',
  },
  {
    name: 'Email Sender Pro',
    slug: 'email-sender-pro',
    shortDesc: 'Масс и-мэйл илгээх, хяналттай',
    description: 'Email Sender Pro нь мянга мянган и-мэйл клиентын хайрцаг руу шууд илгээх чадалтай. Загварын удирдлага, хувийн болговч, нээлтийн хяналт, SMTP ротаци, спам-ийн эрсдэлгүй илгээлттэй.',
    price: 88000,
    oldPrice: 115000,
    icon: 'Mail',
    category: 'Email Tool',
    categorySlug: 'email',
    featured: true,
    rating: 4.8,
    reviewCount: 87,
    features: 'Масс илгээлт;Загварын удирдлага;SMTP ротаци;Нээлтийн хяналт',
  },
  {
    name: 'Email List Validator',
    slug: 'email-list-validator',
    shortDesc: 'И-мэйл хаягийн хүчинтэй байдлыг шалгах',
    description: 'Email List Validator нь и-мэйл хаягийн жинхэнэ байдлыг шалгаж, буруу болон идэвхгүй хаягуудыг арилгана. Хурдан баталгаажуулалт, SMTP шалгалт, буцаж нь бөөнөөр илгээх боломжтой.',
    price: 39000,
    oldPrice: null,
    icon: 'Mail',
    category: 'Email Tool',
    categorySlug: 'email',
    featured: false,
    rating: 4.6,
    reviewCount: 29,
    features: 'SMTP шалгалт;Хурдан баталгаажуулалт;Бөөн импорт/экспорт',
  },
  {
    name: 'AI Content Creator Premium',
    slug: 'ai-content-creator-premium',
    shortDesc: 'AI-аар контент, пост, зураг үүсгэх',
    description: 'AI Content Creator Premium нь Mongolian хэл дэмжлэгтэй AI контент үүсгэгч. Пост, блогийн агуулга, зар сурталчилгааны текст, зураг үүсгэх, видео хөрвүүлэх зэрэг олон модультай. GPT дээр тулгуурласан, хязгааргүй үг.',
    price: 120000,
    oldPrice: 160000,
    icon: 'Sparkles',
    category: 'AI Tool',
    categorySlug: 'ai',
    featured: true,
    rating: 5.0,
    reviewCount: 203,
    features: 'Mongolian хэл дэмжлэг;Контент үүсгэх;Зураг үүсгэх;Хязгааргүй үг',
  },
  {
    name: 'AI Image Generator Pro',
    slug: 'ai-image-generator-pro',
    shortDesc: 'Текстээс өндөр чанарын зураг үүсгэх',
    description: 'AI Image Generator Pro нь энгийн текстээс мэргэжлийн түвшний зураг үүсгэх хэрэгсэл. Хэв маяг сонгох, хэмжээ тохируулах, batch үүсгэх, брэндийн өнгөний тохиргоотой.',
    price: 78000,
    oldPrice: 99000,
    icon: 'Sparkles',
    category: 'AI Tool',
    categorySlug: 'ai',
    featured: false,
    rating: 4.8,
    reviewCount: 74,
    features: 'Текст->зураг;Хэв маяг;Batch үүсгэх;Брэнд өнгө',
  },
  {
    name: 'All-in-One Social Suite',
    slug: 'all-in-one-social-suite',
    shortDesc: 'Бүх платформ нэг багц хэрэгсэл',
    description: 'All-in-One Social Suite нь Facebook, Instagram, TikTok, Telegram, Twitter/X, Email бүх платформын хэрэгсэл нэг багц болсон хамгийн ашигтай сонголт. Нэг лиценз, нэг удирдлагын самбар, нэг удаагийн төлбөр. Жинхэнэ маркетинг багц.',
    price: 320000,
    oldPrice: 480000,
    icon: 'LayoutGrid',
    category: 'Бүх хэрэгсэл',
    categorySlug: 'all',
    featured: true,
    rating: 5.0,
    reviewCount: 91,
    features: 'Бүх платформ;Нэг лиценз;Нэг самбар;Шинэчлэлт үнэгүй',
  },
  {
    name: 'Social Analytics Dashboard',
    slug: 'social-analytics-dashboard',
    shortDesc: 'Бүх платформын статистик нэг дор',
    description: 'Social Analytics Dashboard нь бүх нийтийн медиа платформын статистикийг нэг самбараас харах боломжтой. Өсөлт, хүрээ, хөгжлийн график, тайлан экспорт хийх функцтэй.',
    price: 99000,
    oldPrice: null,
    icon: 'LayoutGrid',
    category: 'Бүх хэрэгсэл',
    categorySlug: 'all',
    featured: false,
    rating: 4.7,
    reviewCount: 52,
    features: 'Нэг самбар;График тайлан;Экспорт хийх',
  },
]

const reviews = [
  { name: 'Бат-Эрдэнэ', role: 'Digital маркетолог', rating: 5, content: 'Telegram Marketing Bot-ыг ашигласнаас хойш манай сувгийн гишүүн 3 дахин өслөө. Хүргэлт маш хурдан, заавар ойлгомжтой байлаа.' },
  { name: 'Сарнай', role: 'SMM менежер', rating: 5, content: 'Instagram Automation Tool нь миний ажлыг маш их хөнгөвчилсөн. Өдөр бүр 30 минут хэмнэгдэж байна. Зөвлөж байна!' },
  { name: 'Дэлгэр', role: 'Контент бүтээгч', rating: 5, content: 'AI Content Creator Premium нь монгол хэл дээр сайн ажилладаг. Зар сурталчилгааны текст бичихэд тун сайрхаж байгаа.' },
  { name: 'Мөнхзул', role: 'Жижиг бизнес эзэмшигч', rating: 4, content: 'Email Sender Pro-г харилцагчтайдаа мэдэгдэл илгээхэд ашиглаж байна. Хүргэлтийн хувь 98% гарсан.' },
  { name: 'Төмөрбаатар', role: 'E-commerce эзэмшигч', rating: 5, content: 'All-in-One багцыг авсан. Бүх хэрэгсэл нэг дор байгаа нь маш практик. Төлбөр нь ч үнэмжилттэй.' },
  { name: 'Хулан', role: 'Influencer', rating: 5, content: 'TikTok Growth Toolkit-аар 2 долоо хоногт дагагч 10К нэмэгдлээ. Бодит хэрэглэгчидтэй. Баярлалаа!' },
]

const faqs = [
  { q: 'Худалдан авалт хийсний дараа хэр хурдан ирэх вэ?', a: 'Төлбөрөө баталгаажуулсны дараа таны хэрэгсэл, хандалтын мэдээлэл и-мэйл болон Telegram-аар 5-10 минутын дотор шууд хүргэгдэнэ. Бүтээгдэхүүнийг гар утсанд татан авах боломжтой.' },
  { q: 'Төлбөрөө хэрхэн хийх вэ?', a: 'Төлбөрийг Qpay-аар банкны апп ашиглан хийх боломжтой. Төлбөр төлөгдсөний дараа систем автомат баталгаажуулна.' },
  { q: 'Бүтээгдэхүүн баталгаатай юу?', a: 'Тийм. Бүх бүтээгдэхүүн 7 хоногийн баталгаатай. Ажиллахгүй бол буцаалт эсвэл солилцоог хийнэ. Бид чанарт анхаардаг.' },
  { q: 'Асуудал гарвал хаана хандах вэ?', a: 'Баруун доод булан дахь чатын товчоор админтай шууд холбогдох эсвэл Telegram хаяг руу бичнэ үү. 24/7 туслах баг бэлэн байна.' },
  { q: 'Буцаалт хийх боломжтой юу?', a: 'Бүтээгдэхүүн ажиллахгүй тохиолдолд 7 хоногийн дотор буцаалт хийгдэнэ. Төлбөрийн буцаалт нь 1-3 ажлын өдөрт хийгдэнэ.' },
]

async function main() {
  console.log('🌱 Seeding database...')

  // Admin user
  const adminUsername = process.env.ADMIN_USERNAME || 'admin'
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) throw new Error('ADMIN_PASSWORD is required to seed the database')
  const passwordHash = await bcrypt.hash(adminPassword, 10)
  await db.adminUser.upsert({
    where: { username: adminUsername },
    create: { username: adminUsername, passwordHash },
    update: { passwordHash },
  })
  console.log('✓ Admin user created:', adminUsername)

  // Categories
  const categoryMap: Record<string, string> = {}
  for (const c of categories) {
    const cat = await db.category.upsert({
      where: { slug: c.slug },
      create: c,
      update: { name: c.name, icon: c.icon, description: c.description, order: c.order },
    })
    categoryMap[c.slug] = cat.id
  }
  console.log('✓ Categories created:', categories.length)

  // Products
  // add duration + tutorial video + instruction images per product
  const productMeta: Record<string, { duration: string; video?: string; images?: string }> = {
    'facebook-account-manager-pro': {
      duration: '6 сар',
      video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      images: 'https://picsum.photos/seed/fb1/800/500;https://picsum.photos/seed/fb2/800/500;https://picsum.photos/seed/fb3/800/500',
    },
    'tiktok-growth-toolkit': {
      duration: '3 сар',
      video: 'https://youtu.be/scM7W0iINkM',
      images: 'https://picsum.photos/seed/tt1/800/500;https://picsum.photos/seed/tt2/800/500',
    },
    'instagram-automation-tool': {
      duration: '6 сар',
      video: 'https://www.youtube.com/watch?v=L_jWHffIx5E',
      images: 'https://picsum.photos/seed/ig1/800/500;https://picsum.photos/seed/ig2/800/500;https://picsum.photos/seed/ig3/800/500',
    },
    'telegram-marketing-bot': {
      duration: '1 жил',
      video: 'https://youtu.be/jNQXAC9IVDw',
      images: 'https://picsum.photos/seed/tg1/800/500;https://picsum.photos/seed/tg2/800/500;https://picsum.photos/seed/tg3/800/500',
    },
    'email-sender-pro': {
      duration: '6 сар',
      video: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
      images: 'https://picsum.photos/seed/em1/800/500;https://picsum.photos/seed/em2/800/500',
    },
    'ai-content-creator-premium': {
      duration: '1 жил',
      video: 'https://youtu.be/kJQP7kiw5Fk',
      images: 'https://picsum.photos/seed/ai1/800/500;https://picsum.photos/seed/ai2/800/500;https://picsum.photos/seed/ai3/800/500',
    },
    'all-in-one-social-suite': {
      duration: 'Бүх амьдрал',
      video: 'https://www.youtube.com/watch?v=ZbZSe6N_BX0',
      images: 'https://picsum.photos/seed/all1/800/500;https://picsum.photos/seed/all2/800/500;https://picsum.photos/seed/all3/800/500',
    },
  }
  const defaultDuration = '3 сар'

  for (const p of products) {
    const catId = categoryMap[p.categorySlug]
    if (!catId) continue
    const meta = productMeta[p.slug] || {}
    await db.product.upsert({
      where: { slug: p.slug },
      create: {
        name: p.name,
        slug: p.slug,
        shortDesc: p.shortDesc,
        description: p.description,
        price: p.price,
        oldPrice: p.oldPrice,
        discount: p.oldPrice ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : null,
        icon: p.icon,
        category: p.category,
        categoryId: catId,
        rating: p.rating,
        reviewCount: p.reviewCount,
        featured: p.featured,
        available: true,
        features: p.features,
        duration: meta.duration || defaultDuration,
        tutorialVideoUrl: meta.video || null,
        instructionImages: meta.images || null,
      },
      update: {
        name: p.name,
        shortDesc: p.shortDesc,
        description: p.description,
        price: p.price,
        oldPrice: p.oldPrice,
        discount: p.oldPrice ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : null,
        rating: p.rating,
        reviewCount: p.reviewCount,
        featured: p.featured,
        features: p.features,
        duration: meta.duration || defaultDuration,
        tutorialVideoUrl: meta.video || null,
        instructionImages: meta.images || null,
      },
    })
  }
  console.log('✓ Products created:', products.length)

  // Reviews
  await db.review.deleteMany()
  for (const r of reviews) {
    await db.review.create({ data: r })
  }
  console.log('✓ Reviews created:', reviews.length)

  // FAQ
  await db.faq.deleteMany()
  for (let i = 0; i < faqs.length; i++) {
    await db.faq.create({ data: { question: faqs[i].q, answer: faqs[i].a, order: i } })
  }
  console.log('✓ FAQs created:', faqs.length)

  // Site settings (admin-editable content)
  const settings: { key: string; value: string }[] = [
    { key: 'heroHeadline', value: 'Таны дижитал ажлын хүчирхэг хэрэгслүүд' },
    { key: 'heroSubtext', value: 'Social media, AI, automation болон marketing хэрэгслүүдийг нэг дороос аюулгүй, хурдан аваарай.' },
    { key: 'heroPrimaryCta', value: 'Бүх хэрэгсэл үзэх' },
    { key: 'heroSecondaryCta', value: 'Хэрхэн ажиллах вэ?' },
    { key: 'promoTitle', value: 'Шинэ хэрэглэгчдэд зориулсан онцгой хямдрал — 30% хүртэл' },
    { key: 'promoDescription', value: 'Анхны захиалгаа хийгчдэд зориулсан онцгой хямдрал. Хугацаа дуустал хүчинтэй.' },
    { key: 'promoCta', value: 'Хямдрал авах' },
    { key: 'promoDiscountPercent', value: '30' },
    { key: 'contactEmail', value: 'help@socialtool.store' },
    { key: 'contactTelegram', value: 'socialtool' },
    { key: 'footerDescription', value: 'SOCIALTOOL.STORE — Social media & AI хэрэгслүүд нэг дор. Монгол хэрэглэгчдэд зориулсан аюулгүй, шуурхай, баталгаатай дижитал хэрэгсэл.' },
    { key: 'footerCopyright', value: '© 2026 SOCIALTOOL.STORE. Бүх эрх хуулиар хамгаалагдсан.' },
  ]
  for (const s of settings) {
    await db.siteSetting.upsert({
      where: { key: s.key },
      create: s,
      update: { value: s.value },
    })
  }
  console.log('✓ Site settings created:', settings.length)

  // Active promotion
  await db.promotion.deleteMany()
  const promoEnd = new Date()
  promoEnd.setDate(promoEnd.getDate() + 3)
  promoEnd.setHours(23, 59, 59, 0)
  await db.promotion.create({
    data: {
      title: 'Шинэ хэрэглэгчдэд зориулсан онцгой хямдрал',
      description: 'Анхны захиалгаа хийгчдэд зориулсан онцгой хямдрал. Хугацаа дуустал хүчинтэй.',
      badgeText: 'Шинэ хэрэглэгчдэд',
      discountPercent: 30,
      active: true,
      endAt: promoEnd,
    },
  })
  console.log('✓ Promotion created')

  // Optional demo customer; password must be explicitly configured.
  const demoPassword = process.env.DEMO_CUSTOMER_PASSWORD
  const existingCustomer = await db.customer.findUnique({ where: { email: 'test@example.com' } })
  if (!existingCustomer && demoPassword) {
    await db.customer.create({
      data: {
        name: 'Демо Хэрэглэгч',
        phone: '99112233',
        email: 'test@example.com',
        passwordHash: await bcrypt.hash(demoPassword, 10),
        telegram: 'demouser',
      },
    })
    console.log('✓ Demo customer created')
  }

  console.log('✅ Seed complete')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
