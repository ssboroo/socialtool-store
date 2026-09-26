import { licenseVariants } from './license'
export function validChannelUrl(value: unknown): value is string {
  return typeof value === 'string' && (value === '' || /^https:\/\/t\.me\/(?:[A-Za-z][A-Za-z0-9_]{4,31}|\+[A-Za-z0-9_-]{8,128})$/.test(value))
}
export function channelPost(p: {name:string;shortDesc:string;price:number;duration?:string|null}) {
  const money=(n:number)=>new Intl.NumberFormat('mn-MN').format(n)+' ₮'
  const variants=licenseVariants(p.duration)
  const prices=variants.length ? variants.map(v=>v.term+' — '+money(v.price??p.price)).join('\n') : money(p.price)
  return [p.name.slice(0,160),p.shortDesc.slice(0,250),prices.slice(0,500),'Дэлгэрэнгүй мэдээлэл, нөхцөлийг сайтаас үзээрэй.'].filter(Boolean).join('\n\n').slice(0,1000)
}
