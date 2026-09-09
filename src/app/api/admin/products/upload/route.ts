import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { getAdminFromRequest } from '@/lib/auth'

/**
 * Product image upload endpoint (admin only).
 *
 * Accepts multipart/form-data with a `file` field (image/jpeg, image/png, image/webp).
 * Saves to /public/uploads/products/ with a unique filename. Returns the
 * public URL path that should be stored in Product.image.
 *
 * Max size 5MB. Filename is slugified + timestamp to avoid collisions.
 */
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Зураг олдсонгүй' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Зөвхөн зураг оруулна уу (JPEG, PNG, WebP, GIF). Таны оруулсан: ${file.type || 'тодорхойгүй'}` },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Зургийн хэмжээ 5MB-аас хэтэрсэн байна (${(file.size / 1024 / 1024).toFixed(1)}MB)` },
        { status: 400 }
      )
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Build a safe unique filename: <timestamp>-<random>.<ext>
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg'
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExt}`
    const filepath = path.join(uploadDir, filename)

    const bytes = await file.arrayBuffer()
    await writeFile(filepath, Buffer.from(bytes))

    // Return the public URL path (relative so it works on any domain)
    const url = `/uploads/products/${filename}`
    return NextResponse.json({ url, filename })
  } catch (e) {
    console.error('Image upload error:', e)
    return NextResponse.json({ error: 'Зураг хадгалахад алдаа гарлаа' }, { status: 500 })
  }
}
