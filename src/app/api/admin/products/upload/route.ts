import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { getAdminFromRequest } from '@/lib/auth'

/** Admin image uploads are decoded and stored durably in the application DB. */
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


    // Decode and re-encode the upload; never trust the extension or MIME alone.
    let bytes: Buffer
    try {
      bytes = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 40000000 })
        .rotate().resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 }).toBuffer()
    } catch {
      return NextResponse.json({ error: 'Зургийг уншиж чадсангүй. Хүчинтэй JPEG, PNG, WebP эсвэл GIF файл сонгоно уу.' }, { status: 400 })
    }
    const filename = `${randomUUID()}.webp`
    await db.uploadedImage.create({ data: { filename, mimeType: 'image/webp', bytes: new Uint8Array(bytes) } })

    // Return the public URL path (relative so it works on any domain)
    const url = `/uploads/products/${filename}`
    return NextResponse.json({ url, filename })
  } catch (e) {
    console.error('Image upload error:', e)
    return NextResponse.json({ error: 'Зураг хадгалагдсангүй. Өгөгдлийн сангийн UploadedImage шинэчлэл болон холболтыг шалгана уу.' }, { status: 503 })
  }
}
