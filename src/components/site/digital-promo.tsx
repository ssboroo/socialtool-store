import { ArrowRight } from 'lucide-react'

export function DigitalPromo({ mobile = false }: { mobile?: boolean }) {
  return <a href="#products" className={`catalog-side-note${mobile ? ' catalog-mobile-promo' : ''}`}>
    <img src="/hero-glass.webp" alt="" width={1100} height={733} loading="lazy" />
    <p>Дижитал ертөнцийг<br />хамтдаа бүтээе.</p>
    <ArrowRight size={18} aria-hidden="true" />
  </a>
}
