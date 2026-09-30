import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const category = {
  name: 'Adobe',
  slug: 'adobe',
  icon: 'Adobe',
  description: 'Adobe-ийн албан ёсны лицензийн бүтээгдэхүүнүүд',
  order: 7,
}

const names = [
  ['Adobe Creative Cloud Pro','adobe-creative-cloud-pro','20+ бүтээлч апп болон Adobe Firefly AI нэг багцад','Creative Cloud Pro;20+ apps;Adobe Firefly;Official Adobe licensing'],
  ['Adobe Acrobat Pro','adobe-acrobat-pro','PDF үүсгэх, засах, гарын үсэг зурах, удирдах','PDF;E-signature;Document management'],
  ['Adobe Photoshop','adobe-photoshop','Зураг засвар, compositing, график дизайн','Photo editing;Compositing;Graphic design'],
  ['Adobe Illustrator','adobe-illustrator','Вектор график, лого, иллюстрац бүтээх','Vector graphics;Illustration;Typography'],
  ['Adobe Premiere','adobe-premiere','Мэргэжлийн видео болон кино эвлүүлэг','Video editing;Video production'],
  ['Adobe After Effects','adobe-after-effects','Motion graphics болон visual effects','Motion graphics;Visual effects'],
  ['Adobe InDesign','adobe-indesign','Хэвлэл, каталог, eBook, интерактив PDF дизайн','Publishing;Layout;Interactive PDF'],
  ['Adobe Lightroom','adobe-lightroom','Зураг засварлах, өнгө боловсруулах, зохион байгуулах','Photography;Photo editing;Cloud'],
  ['Adobe Lightroom Classic','adobe-lightroom-classic','Desktop-д зориулсан мэргэжлийн зураг засвар ба каталог','Photography;Desktop workflow;Catalog'],
  ['Adobe Firefly','adobe-firefly','Adobe-ийн generative AI зураг, видео, аудио бүтээлт','Generative AI;Image;Video;Audio'],
  ['Adobe Express Premium','adobe-express-premium','Social контент, дизайн, видео хурдан бүтээх','Social media;Templates;Design'],
  ['Adobe Audition','adobe-audition','Аудио бичлэг, mix болон sound effects','Audio editing;Mixing;Podcast'],
  ['Adobe Animate','adobe-animate','2D animation, banner, game болон web animation','Animation;Web;Games'],
  ['Adobe Character Animator','adobe-character-animator','Дүрийг нүүрний хөдөлгөөн, дуугаар real-time animate хийх','Character animation;Motion capture'],
  ['Adobe Media Encoder','adobe-media-encoder','Видео, аудио файлыг олон формат руу encode хийх','Encoding;Video;Audio'],
  ['Adobe Fresco','adobe-fresco','Digital painting болон drawing','Painting;Drawing;Illustration'],
  ['Adobe Dreamweaver','adobe-dreamweaver','Website дизайн болон код засвар','Web design;Coding'],
  ['Adobe Bridge','adobe-bridge','Creative asset зохион байгуулах, preview хийх','Asset management;Preview;Metadata'],
]

async function main() {
  const cat = await db.category.upsert({
    where: { slug: category.slug },
    update: category,
    create: category,
  })

  for (const [name, slug, shortDesc, features] of names) {
    const data = {
      name, slug, shortDesc,
      description: name + ' — Socialtool-ийн Adobe Partner Connection Reseller сувгаар нийлүүлэхээр бэлтгэж буй бүтээгдэхүүн. Монголд үйлчлэх Adobe authorized distributor-аас тухайн SKU, reseller үнэ болон provisioning нөхцөл баталгаажсаны дараа худалдаа идэвхжинэ.',
      price: 0,
      oldPrice: null,
      discount: null,
      image: null,
      icon: 'Adobe',
      category: 'Adobe',
      categoryId: cat.id,
      rating: 5,
      reviewCount: 0,
      available: false,
      featured: false,
      deliveryInfo: 'Албан ёсны distributor SKU баталгаажсаны дараа',
      features,
      duration: null,
      tutorialVideoUrl: null,
      instructionImages: null,
      downloadUrl: null,
      requiresOrderLink: false,
      searchKeywords: name.toLowerCase() + ';adobe;official license;албан ёсны лиценз',
    }
    await db.product.upsert({ where: { slug }, update: data, create: data })
  }
  console.info('[Adobe catalog] synced', names.length, 'products')
}

main().finally(() => db.$disconnect())
