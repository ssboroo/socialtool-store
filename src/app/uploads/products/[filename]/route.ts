import { db } from '@/lib/db'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { getUploadDir, validImageFilename } from '@/lib/uploads'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CACHE_CONTROL = 'public, max-age=31536000, immutable, stale-while-revalidate=86400, stale-if-error=2592000'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function findUploadedImage(filename: string) {
  let lastError: unknown = null
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await db.uploadedImage.findUnique({ where: { filename } })
    } catch (error) {
      lastError = error
      const message = String(error).toLowerCase()
      const transient = message.includes('locked') || message.includes('busy') || message.includes('timeout')
      if (!transient || attempt === 2) break
      await sleep(40 * (attempt + 1))
    }
  }
  if (lastError) console.warn('Uploaded image lookup failed; trying legacy storage:', String(lastError))
  return null
}

function imageResponse(req: Request, filename: string, bytes: Uint8Array, mimeType: string) {
  const etag = `"${filename}-${bytes.byteLength}"`
  const headers = new Headers({
    'Content-Type': mimeType,
    'Content-Length': String(bytes.byteLength),
    'Cache-Control': CACHE_CONTROL,
    'ETag': etag,
    'X-Content-Type-Options': 'nosniff',
    'Content-Disposition': `inline; filename="${filename}"`,
  })
  if (req.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers })

  const body = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(body).set(bytes)
  return new Response(body, { headers })
}

export async function GET(req: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params
  if (!validImageFilename(filename)) {
    return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } })
  }

  const saved = await findUploadedImage(filename)
  if (saved) return imageResponse(req, filename, new Uint8Array(saved.bytes), saved.mimeType)

  try {
    const bytes = await readFile(path.join(getUploadDir(), filename))
    const ext = filename.split('.').pop()!.toLowerCase()
    const mime: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif',
    }
    return imageResponse(req, filename, new Uint8Array(bytes), mime[ext] || 'application/octet-stream')
  } catch {
    return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } })
  }
}
