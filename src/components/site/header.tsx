'use client'
import { useState } from 'react'
import { Menu, Search, ShoppingCart, User, X } from 'lucide-react'
import { Logo } from './logo'
import { useCartStore, useUIStore } from '@/store/cart'
import { useCustomer } from '@/hooks/use-customer'

const links=[{name:'Нүүр',href:'#top'},{name:'Бүтээгдэхүүн',href:'#products'},{name:'Заавар',href:'#how'},{name:'Тусламж',href:'#faq'}]
export function Header(){
  const [query,setQuery]=useState('')
  const [mobile,setMobile]=useState(false)
  const count=useCartStore(s=>s.count())
  const openCart=useCartStore(s=>s.open)
  const openAuth=useUIStore(s=>s.openAuth)
  const openAccount=useUIStore(s=>s.openAccount)
  const {customer}=useCustomer()
  function navigate(href:string){setMobile(false);const el=document.querySelector(href);el?.closest('details')?.setAttribute('open','');el?.scrollIntoView({behavior:'smooth',block:'start'})}
  function search(e:React.FormEvent){e.preventDefault();window.dispatchEvent(new CustomEvent('st-search',{detail:query}));navigate('#products')}
  return <header className="store-header store-container"><div className="store-nav-surface">
    <button className="store-logo-button" onClick={()=>navigate('#top')} aria-label="Нүүр хуудас"><Logo /></button>
    <form className="store-search" role="search" onSubmit={search}><input aria-label="Бүтээгдэхүүн хайх" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Бүтээгдэхүүн хайх…" /><button aria-label="Хайх" type="submit"><Search size={18} /></button></form>
    <nav aria-label="Үндсэн цэс" className="store-desktop-nav">{links.map(l=><button key={l.href} className={l.href==='#products'?'active':''} onClick={()=>navigate(l.href)}>{l.name}</button>)}</nav>
    <div className="store-nav-actions"><button className="store-cart-button" onClick={openCart} aria-label={`Сагс${count?`, ${count} бараа`:''}`}><ShoppingCart size={23} />{count>0&&<span>{count}</span>}</button><button className="store-account-button" onClick={()=>customer?openAccount():openAuth('login')}><User size={20} /><span>{customer?customer.name.split(' ')[0]:'Миний аккаунт'}</span></button><button className="store-mobile-toggle" onClick={()=>setMobile(v=>!v)} aria-label="Цэс" aria-expanded={mobile}>{mobile?<X />:<Menu />}</button></div>
    {mobile&&<nav className="store-mobile-nav" aria-label="Гар утасны цэс">{links.map(l=><button key={l.href} onClick={()=>navigate(l.href)}>{l.name}</button>)}</nav>}
  </div></header>
}
