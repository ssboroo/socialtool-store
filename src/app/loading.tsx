export default function Loading() {
  return <main className="store-route-state" aria-busy="true">
    <div role="status"><h1>Түр хүлээнэ үү</h1><p>Хэрэгслүүдийг ачаалж байна…</p></div>
    <div className="catalog-skeleton" aria-hidden="true"><div className="catalog-skeleton-art"/><div className="catalog-skeleton-line"/></div>
  </main>
}
