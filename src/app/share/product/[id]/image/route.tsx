import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { db } from '@/lib/db'
import { getUploadDir, validImageFilename } from '@/lib/uploads'
import { suggestProductImage } from '@/lib/product-image-suggestions'

export const runtime = 'nodejs'

async function localProductImage(image: string | null, name: string, category: string) {
  const source = image || suggestProductImage(name, category)
  try {
    let file: string | Buffer | undefined
    if (source.startsWith('/uploads/products/')) {
      const filename = source.slice('/uploads/products/'.length)
      if (validImageFilename(filename)) {
        const saved = await db.uploadedImage.findUnique({ where: { filename }, select: { bytes:true } })
        file = saved ? Buffer.from(saved.bytes) : path.join(getUploadDir(), filename)
      }
    } else if (/^\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\.(?:svg|png|jpe?g|webp|gif)$/.test(source)) {
      file = path.join(process.cwd(), 'public', source.slice(1))
    }
    if (!file) throw new Error('No local product image')
    const imageBuffer = await sharp(file, { limitInputPixels: 20_000_000 }).resize(460, 410, { fit: 'inside', withoutEnlargement: true }).png().toBuffer()
    return `data:image/png;base64,${imageBuffer.toString('base64')}`
  } catch {
    const logo = await readFile(path.join(process.cwd(), 'public/socialtool-logo-s.png'))
    return `data:image/png;base64,${logo.toString('base64')}`
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const product = await db.product.findUnique({ where: { id: (await params).id } })
  if (!product || !product.available) return new Response('Not found', { status: 404 })
  const [art, logo, font] = await Promise.all([
    localProductImage(product.image, product.name, product.category),
    readFile(path.join(process.cwd(), 'public/socialtool-logo.png')),
    readFile(path.join(process.cwd(), 'public/fonts/noto-sans-share.ttf')),
  ])
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', padding: 48, color: '#111c3b', background: 'linear-gradient(125deg, #f8fcff, #e5f1ff 65%, #eae2ff)', fontFamily: 'Noto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', width: 620, paddingRight: 36, justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 34, fontSize: 22 }}><img src={`data:image/png;base64,${logo.toString('base64')}`} width={48} height={48} alt="" /><span>SOCIALTOOL.STORE</span></div>
        <span style={{ fontSize: 22, color: '#5345c5', marginBottom: 18 }}>{product.category.slice(0, 50)}</span>
        <div style={{ display: 'flex', fontSize: product.name.length > 55 ? 38 : 48, lineHeight: 1.25, marginBottom: 22 }}>{product.name.slice(0, 115)}</div>
        <div style={{ display: 'flex', fontSize: 23, lineHeight: 1.5, color: '#51627f' }}>{product.shortDesc.slice(0, 150)}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 460, height: 460, marginTop: 34, borderRadius: 36, border: '2px solid white', background: 'rgba(255,255,255,.7)', boxShadow: '0 16px 40px rgba(78,100,170,.12)' }}><img src={art} width={410} height={390} style={{ objectFit: 'contain' }} alt="" /></div>
    </div>,
    { width: 1200, height: 630, fonts: [{ name: 'Noto', data: font, style: 'normal', weight: 400 }], headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' } },
  )
}
