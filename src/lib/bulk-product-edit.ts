import { z } from 'zod'
import { licenseVariants } from './license'

export const bulkEditSchema=z.object({
  items:z.array(z.object({id:z.string().min(1).max(120),updatedAt:z.string().datetime()})).min(1).max(100),
  patch:z.object({
    categoryId:z.string().min(1).max(120).optional(),available:z.boolean().optional(),featured:z.boolean().optional(),
    shortDescTemplate:z.string().max(500).optional(),
    price:z.object({mode:z.enum(['set','percent']),value:z.number().finite(),includeVariants:z.boolean()}).optional(),
  }).strict().refine(p=>Object.keys(p).length>0),
}).strict().refine(b=>new Set(b.items.map(p=>p.id)).size===b.items.length)
export type BulkPatch=z.infer<typeof bulkEditSchema>['patch']
export function bulkProductData(p:{name:string;category:string;price:number;oldPrice:number|null;duration:string|null;downloadUrl?:string|null},patch:BulkPatch,category?:{id:string;name:string}|null){
  const data:Record<string,unknown>={}
  if(category){data.categoryId=category.id;data.category=category.name}
  if(patch.available!==undefined)data.available=patch.available
  if(patch.featured!==undefined)data.featured=patch.featured
  if(patch.shortDescTemplate!==undefined){
    const text=patch.shortDescTemplate.replaceAll('{name}',p.name).replaceAll('{category}',category?.name||p.category)
    if(text.length>500)throw new Error('Товч тайлбар 500 тэмдэгтээс хэтэрлээ')
    data.shortDesc=text
  }
  if(patch.price){
    if(p.downloadUrl)throw new Error('Үнэгүй программын үнийг бөөнөөр өөрчлөхгүй. Бүтээгдэхүүний дэлгэрэнгүй засварыг ашиглана уу.')
    const {mode,value,includeVariants}=patch.price
    if(mode==='percent'&&(value<=-100||value>1000))throw new Error('Үнийн өөрчлөлт -100%-аас их, 1000%-аас бага байна')
    const priceOf=(n:number)=>{const v=mode==='set'?value:Math.round(n*(1+value/100));if(!Number.isSafeInteger(v)||v<1||v>2147483647)throw new Error('Үнэ зөв эерэг бүхэл тоо байх ёстой');return v}
    const next=priceOf(p.price);data.price=next
    // Old comparison price may no longer be valid after a price increase.
    const old=p.oldPrice!==null&&p.oldPrice>next?p.oldPrice:null
    data.oldPrice=old;data.discount=old?Math.round((old-next)/old*100):null
    if(includeVariants&&p.duration)data.duration=JSON.stringify(licenseVariants(p.duration).map(v=>({term:v.term,price:priceOf(v.price??p.price)})))
  }
  return data
}
