import path from 'node:path'

/** Set UPLOAD_DIR to a mounted persistent volume in production. */
export function getUploadDir() {
  return path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR || path.join(process.cwd(), 'public/uploads/products'))
}
export function validImageFilename(filename: string) {
  return /^[A-Za-z0-9_-]+\.(?:jpe?g|png|webp|gif)$/.test(filename)
}
