export function scrollBehavior(reducedMotion: boolean): ScrollBehavior {
  return reducedMotion ? 'instant' : 'smooth'
}

export function scrollToStoreSection(selector: string, navigate?: (href: string) => void) {
  const target = document.querySelector(selector)
  if (!target) {
    if (/^#[a-z-]+$/.test(selector)) navigate?.('/' + selector)
    return
  }
  target.scrollIntoView({
    behavior: scrollBehavior(window.matchMedia('(prefers-reduced-motion: reduce)').matches),
    block: 'start',
  })
}
