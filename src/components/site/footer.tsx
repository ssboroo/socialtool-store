'use client'
import { useState } from 'react'
import { Mail, Send } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { ProductDescription } from './product-description'
export function Footer({settings}:{settings?:Record<string,string>}){
  const [policy,setPolicy]=useState<string|null>(null)
  function navigate(id:string){const el=document.querySelector(id);el?.closest('details')?.setAttribute('open','');el?.scrollIntoView({behavior:'smooth'})}
  return <><footer className="store-footer store-container"><div className="store-footer-brand"><div className="store-footer-contact"><a aria-label="И-мэйл" href={`mailto:${settings?.contactEmail||'help@socialtool.store'}`}><Mail size={15}/></a><a aria-label="Telegram" href={`https://t.me/${(settings?.contactTelegram||'socialtool').replace(/^@/,'')}`} target="_blank" rel="noopener noreferrer"><Send size={15}/></a></div><strong>SOCIALTOOL.STORE</strong><span>Дижитал хэрэгсэл. Илүү их боломж.</span></div><nav aria-label="Нэмэлт холбоос"><button onClick={()=>navigate('#top')}>Нүүр</button><button onClick={()=>navigate('#products')}>Бүтээгдэхүүн</button><button onClick={()=>navigate('#faq')}>Тусламж</button><button onClick={()=>setPolicy('termsOfService')}>Үйлчилгээний нөхцөл</button><button onClick={()=>setPolicy('privacyPolicy')}>Нууцлалын бодлого</button></nav></footer><Dialog open={!!policy} onOpenChange={o=>{if(!o)setPolicy(null)}}><DialogContent className="max-h-[85vh] overflow-y-auto bg-white sm:max-w-2xl"><DialogTitle>{policy==='privacyPolicy'?'Нууцлалын бодлого':'Үйлчилгээний нөхцөл'}</DialogTitle><ProductDescription text={settings?.[policy||'']||'Мэдээлэл хараахан нийтлэгдээгүй байна. Админтай холбогдоно уу.'}/></DialogContent></Dialog></>
}
