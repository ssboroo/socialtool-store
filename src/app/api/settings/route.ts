import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const rows = await db.siteSetting.findMany()
  const map: Record<string, string> = {}
  for (const s of rows) map[s.key] = s.value
  return NextResponse.json(map)
}
