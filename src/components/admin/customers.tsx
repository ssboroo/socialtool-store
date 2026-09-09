'use client'

import { useEffect, useState } from 'react'
import { Loader2, Mail, Phone, Send, ShoppingBag, Users, Calendar } from 'lucide-react'
import { formatTugrik } from '@/lib/format'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  telegram: string | null
  createdAt: string
  orderCount: number
  totalSpent: number
}

export function AdminCustomers({ token }: { token: string }) {
  const [items, setItems] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/customers', { headers: { authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return <div className="grid place-items-center py-20"><Loader2 className="size-7 animate-spin text-[#1677FF]" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-[#5B7290]">
        <Users className="size-4" /> {items.length} бүртгэлтэй хэрэглэгч
      </div>

      {items.length === 0 ? (
        <div className="py-16 text-center">
          <Users className="mx-auto size-10 text-[#5B7290]/40" />
          <p className="mt-3 text-sm text-[#5B7290]">Бүртгэлтэй хэрэглэгч байхгүй</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-[#D6E4FF] shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F5F9FF] text-[#5B7290] text-xs uppercase">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold">Хэрэглэгч</th>
                  <th className="text-left px-5 py-3 font-semibold">Холбоо</th>
                  <th className="text-left px-5 py-3 font-semibold">Захиалга</th>
                  <th className="text-left px-5 py-3 font-semibold">Зарцуулс</th>
                  <th className="text-left px-5 py-3 font-semibold">Бүртгүүлсэн</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF4FF]">
                {items.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F5F9FF]/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#1677FF] to-[#0B4DBA] text-white text-[11px] font-bold shrink-0">
                          {c.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#102A43] truncate">{c.name}</p>
                          <p className="text-xs text-[#5B7290] truncate">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-[#5B7290]">
                      <div className="flex items-center gap-1"><Phone className="size-3" /> {c.phone}</div>
                      {c.telegram && <div className="flex items-center gap-1 mt-0.5"><Send className="size-3" /> {c.telegram}</div>}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#102A43]">
                        <ShoppingBag className="size-3.5 text-[#1677FF]" /> {c.orderCount}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-bold text-[#102A43]">{formatTugrik(c.totalSpent)}</td>
                    <td className="px-5 py-3 text-xs text-[#5B7290]">
                      <span className="inline-flex items-center gap-1"><Calendar className="size-3" /> {new Date(c.createdAt).toLocaleDateString('mn-MN')}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
