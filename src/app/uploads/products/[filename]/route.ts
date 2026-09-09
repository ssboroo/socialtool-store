import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { getUploadDir, validImageFilename } from '@/lib/uploads'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params
  if (!validImageFilename(filename)) return new Response('Not found', { status: 404 })
  try {
    const bytes = await readFile(path.join(getUploadDir(), filename))
    const ext = filename.split('.').pop()!
    const mime: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' }
    return new Response(new Uint8Array(bytes), { headers: {
      'Content-Type': mime[ext],
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    } })
  } catch { return new Response('Not found', { status: 404 }) }
}
