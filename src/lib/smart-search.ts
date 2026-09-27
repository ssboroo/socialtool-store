import { detectProductBrandName } from '@/lib/product-brand'
import { detectGameBrand } from '@/lib/game-brand'

export type Searchable = { id:string; name:string; shortDesc:string; description?:string; category:string; price:number; featured:boolean; available:boolean; rating?:number }
export function normalizeSearch(value:string) {
  return value.normalize('NFKC').toLocaleLowerCase().replace(/[‐‑–—_]/g,' ').replace(/[^\p{L}\p{N}]+/gu,' ').replace(/\s+/g,' ').trim()
}
export function editDistance(a:string,b:string,limit=2) {
  if (Math.abs(a.length-b.length)>limit) return limit+1
  const prev=Array.from({length:b.length+1},(_,i)=>i)
  for(let i=1;i<=a.length;i++){
    const next=[i]
    let min=i
    for(let j=1;j<=b.length;j++){
      const value=Math.min(next[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1))
      next[j]=value;min=Math.min(min,value)
    }
    if(min>limit)return limit+1
    for(let j=0;j<=b.length;j++)prev[j]=next[j]
  }
  return prev[b.length]
}
export function scoreProduct(product:Searchable,query:string) {
  const q=normalizeSearch(query)
  if(!q)return product.featured?3:1
  const name=normalizeSearch(product.name),cat=normalizeSearch(product.category),desc=normalizeSearch(product.shortDesc)
  const pieces=q.split(' ').filter(Boolean)
  const namedBrand=detectProductBrandName(query)
  const game=detectGameBrand({name:query})
  let score=0
  if(name===q)score+=130
  if(name.startsWith(q))score+=90
  if(name.includes(q))score+=65
  if(cat.includes(q))score+=22
  if(desc.includes(q))score+=12
  if(namedBrand && namedBrand!=='generic' && detectProductBrandName(product.name)===namedBrand)score+=48
  if(game && game!=='gaming' && detectGameBrand({name:product.name})===game)score+=48
  const words=name.split(' ')
  for(const piece of pieces){
    if(words.some(w=>w===piece))score+=22
    else if(words.some(w=>w.startsWith(piece)))score+=13
    else if(words.some(w=>piece.length>=4 && editDistance(w,piece,2)<=2))score+=8
    else if(cat.includes(piece))score+=4
  }
  return score>0?score+(product.featured?2:0):0
}
export function smartSearch<T extends Searchable>(products:T[],query:string,limit=100) {
  if(!query.trim())return products.filter(p=>p.available).slice(0,limit)
  return products.filter(p=>p.available).map(p=>({p,score:scoreProduct(p,query)})).filter(x=>x.score>0)
   .sort((a,b)=>b.score-a.score || (b.p.rating??0)-(a.p.rating??0)).slice(0,limit).map(x=>x.p)
}
