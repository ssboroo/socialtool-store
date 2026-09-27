import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { detectProductBrandName } from './product-brand'
import { detectGameBrand } from './game-brand'
import { parseDownloadUrl } from './free-download'

export type HealthProduct = {
  id: string; name: string; slug: string; shortDesc: string; description: string
  category: string; categoryId: string; price: number; oldPrice: number | null
  image: string | null; icon: string; downloadUrl: string | null; requiresOrderLink: boolean
  tutorialVideoUrl?: string | null; available: boolean
}
export type HealthIssue = {
  productId: string; name: string; code: string; severity: 'critical' | 'warning' | 'info'
  message: string; remedy: string
}

export function inspectProducts(products: HealthProduct[], validCategories: Set<string>, uploadedImages: Set<string>): HealthIssue[] {
  const issues: HealthIssue[] = []
  const names = new Map<string, number>()
  for (const product of products) {
    const normalized = product.name.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim()
    const duplicateKey = product.categoryId + ':' + normalized
    names.set(duplicateKey, (names.get(duplicateKey) || 0) + 1)
  }
  for (const product of products) {
    const add = (code: string, severity: HealthIssue['severity'], message: string, remedy: string) =>
      issues.push({ productId: product.id, name: product.name, code, severity, message, remedy })
    const normalized = product.name.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim()
    if (!product.name.trim()) add('name', 'critical', 'Бүтээгдэхүүний нэр хоосон', 'Нэр өгнө үү.')
    if (!product.slug.trim()) add('slug', 'critical', 'Slug хоосон', 'Бүтээгдэхүүний URL-ийг тохируулна уу.')
    if (!validCategories.has(product.categoryId)) add('category', 'critical', 'Ангилал байхгүй', 'Хүчинтэй ангилал сонгоно уу.')
    if (!Number.isSafeInteger(product.price) || product.price < 0 || (product.price === 0 && !product.downloadUrl))
      add('price', 'critical', 'Үнэ эсвэл үнэгүй татах холбоос буруу', 'Төлбөртэй бараанд эерэг үнэ, үнэгүй программд HTTPS татах линк оруулна уу.')
    if (product.oldPrice != null && product.oldPrice <= product.price)
      add('old_price', 'critical', 'Хуучин үнэ одоогийн үнээс бага/тэнцүү', 'Хуучин үнийг шинэчилнэ үү.')
    if (product.downloadUrl && !parseDownloadUrl(product.downloadUrl))
      add('download', 'critical', 'Татах холбоосын HTTPS формат буруу', 'Аюулгүй HTTPS холбоос оруулна уу.')
    if (product.downloadUrl && product.requiresOrderLink)
      add('link_conflict', 'critical', 'Үнэгүй татах бараанд захиалгын линк шаардаж байна', 'Захиалгын линк шаардлагыг унтраана уу.')
    if (!product.shortDesc?.trim() || product.shortDesc.trim().length < 15)
      add('short_description', 'warning', 'Товч тайлбар дутуу', 'Бүтээгдэхүүний үндсэн зориулалтыг 15-аас олон тэмдэгтээр бичнэ үү.')
    if (!product.description?.trim() || product.description.replace(/<[^>]+>/g, '').trim().length < 40)
      add('description', 'warning', 'Бүрэн тайлбар дутуу', 'Хэрэглээ, хүргэлт, нийцтэй байдал, нөхцөлийг нэмж бичнэ үү.')
    if (names.get(product.categoryId + ':' + normalized)! > 1)
      add('duplicate', 'warning', 'Ижил нэртэй бүтээгдэхүүн ангилалд давхардсан', 'Хувилбар эсвэл давхардлыг шалгана уу.')
    if (!product.image || product.image.startsWith('/products/default/')) {
      const known = detectGameBrand({ name: product.name }) || detectProductBrandName(product.name)
      if (!known && !product.icon.startsWith('brand:') && !product.icon.startsWith('http')) {
        add('unrecognized_logo', 'warning', 'Брэнд танигдаагүй эсвэл өөрийн зураггүй', 'Админ хэсгээс брэнд сонгох эсвэл зураг оруулна уу.')
      }
    } else if (product.image.startsWith('/uploads/products/')) {
      const filename = product.image.slice('/uploads/products/'.length).split('?')[0]
      if (!/^[\w.-]{1,180}$/.test(filename) ||
          (!uploadedImages.has(filename) && !existsSync(join(process.env.UPLOAD_DIR || 'public/uploads/products', filename)))) {
        add('missing_upload', 'critical', 'Оруулсан зургийн файл олдсонгүй', 'Зургаа дахин оруулж хадгална уу.')
      }
    } else if (product.image.startsWith('/')) {
      if (!/^\/[\w./-]+$/.test(product.image) || product.image.includes('..') || !existsSync(join(process.cwd(), 'public', product.image.slice(1)))) {
        add('missing_local_image', 'critical', 'Зургийн файл 404 болох магадлалтай', 'Зургийн хаягийг засна уу.')
      }
    } else {
      try {
        const imageUrl = new URL(product.image)
        if (imageUrl.protocol !== 'https:') throw Error('Invalid URL')
      } catch { add('image_url', 'warning', 'Зургийн URL буруу', 'HTTPS зураг ашиглана уу.') }
    }
    if (product.tutorialVideoUrl && !/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(product.tutorialVideoUrl))
      add('video_url', 'info', 'Зааврын видеоны линкийг нягтлах', 'YouTube HTTPS линк ашиглана уу.')
  }
  const order = { critical: 0, warning: 1, info: 2 }
  return issues.sort((a, b) => order[a.severity] - order[b.severity] || a.name.localeCompare(b.name))
}
