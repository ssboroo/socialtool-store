// Run after the additive schema update, while the old image directory still exists.
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
const directory = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public/uploads/products')
try {
  let count = 0
  for (const filename of await readdir(directory)) {
    if (!/^[A-Za-z0-9_-]+\.(?:jpe?g|png|webp|gif)$/.test(filename)) continue
    const ext = filename.split('.').pop()
    const mime = { jpg:'image/jpeg', jpeg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif' }[ext]
    const bytes = await readFile(path.join(directory, filename))
    await db.uploadedImage.upsert({ where:{filename}, create:{filename,mimeType:mime,bytes}, update:{} })
    count++
  }
  console.log(`Imported ${count} images without changing URLs or deleting files.`)
} finally { await db.$disconnect() }
