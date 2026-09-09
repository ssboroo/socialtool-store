import type { Product, Category } from '@prisma/client'

export function formatTugrik(amount: number): string {
  return new Intl.NumberFormat('mn-MN').format(amount) + ' ₮'
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\u0400-\u04FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function generateOrderNumber(): string {
  const d = new Date()
  const y = d.getFullYear().toString().slice(-2)
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `ST${y}${m}${day}${rand}`
}

export interface ProductWithCategory extends Product {
  categoryRef: Category
}

export const CATEGORY_ICONS: Record<string, string> = {
  Facebook: 'Facebook',
  TikTok: 'Music2',
  Instagram: 'Instagram',
  Twitter: 'Twitter',
  Telegram: 'Send',
  Email: 'Mail',
  AI: 'Sparkles',
  All: 'LayoutGrid',
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  NEW: 'Шинэ захиалга',
  PENDING_PAYMENT: 'Төлбөр хүлээгдэж байна',
  PAID: 'Төлбөр төлөгдсөн',
  DELIVERED: 'Хүргэгдсэн',
  CANCELLED: 'Цуцлагдсан',
}

export const ORDER_STATUS_COLOR: Record<string, string> = {
  NEW: 'bg-blue-100 text-[#1677FF] border-blue-200',
  PENDING_PAYMENT: 'bg-amber-100 text-[#F59E0B] border-amber-200',
  PAID: 'bg-emerald-100 text-[#16A34A] border-emerald-200',
  DELIVERED: 'bg-sky-100 text-[#0B4DBA] border-sky-200',
  CANCELLED: 'bg-red-100 text-red-600 border-red-200',
}
