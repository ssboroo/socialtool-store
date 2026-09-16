'use client'

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="store-route-state">
    <div role="alert"><h1>Хуудсыг ачаалж чадсангүй</h1><p>Холболтоо шалгаад дахин оролдоно уу. Асуудал үргэлжилбэл түр хүлээгээд хуудсаа шинэчлээрэй.</p></div>
    <button type="button" onClick={reset}>Дахин оролдох</button>
  </main>
}
