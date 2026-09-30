import { BadgeCheck, CalendarDays, ShieldCheck } from 'lucide-react'

export function AdobeResellerProof() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8" aria-label="Adobe Partner Connection reseller membership">
      <div className="overflow-hidden rounded-3xl border border-red-100 bg-white shadow-sm">
        <div className="grid gap-6 p-6 md:grid-cols-[1.3fr_.7fr] md:p-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
              <BadgeCheck className="size-4" /> Adobe Partner Connection
            </div>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Socialtool — Reseller membership идэвхтэй</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Socialtool нь Adobe Partner Connection Reseller Program-д бүртгэлтэй. Adobe бүтээгдэхүүний захиалгыг зөвхөн Adobe-ийн зөвшөөрөгдсөн түгээлтийн сувгийн SKU, үнэ болон лицензийн нөхцөл баталгаажсаны дараа идэвхжүүлнэ.
            </p>
            <a className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-red-700 hover:underline" href="https://partners.adobe.com/apac/channelpartners/" target="_blank" rel="noreferrer">
              Adobe Partner Connection-ийн албан ёсны мэдээлэл →
            </a>
          </div>
          <div className="grid content-center gap-3 rounded-2xl bg-slate-950 p-5 text-white">
            <div className="flex items-center gap-3"><ShieldCheck className="size-5 text-red-400"/><div><small className="text-slate-400">Membership type</small><p className="font-bold">Reseller</p></div></div>
            <div className="h-px bg-white/10"/>
            <div className="flex items-center gap-3"><BadgeCheck className="size-5 text-emerald-400"/><div><small className="text-slate-400">Status</small><p className="font-bold">Active</p></div></div>
            <div className="h-px bg-white/10"/>
            <div className="flex items-center gap-3"><CalendarDays className="size-5 text-sky-400"/><div><small className="text-slate-400">Membership expiration</small><p className="font-bold">2027-09-30</p></div></div>
          </div>
        </div>
      </div>
    </section>
  )
}
