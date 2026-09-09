import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'

const SECRET = process.env.JWT_SECRET || 'socialtool-store-jwt-secret-2026'

export async function ensureDefaultAdmin() {
  const username = process.env.ADMIN_USERNAME || 'admin'
  const password = process.env.ADMIN_PASSWORD || 'admin123'
  const existing = await db.adminUser.findUnique({ where: { username } })
  if (existing) return existing
  const passwordHash = await bcrypt.hash(password, 10)
  return db.adminUser.create({ data: { username, passwordHash } })
}

export async function verifyAdminCredentials(username: string, password: string) {
  const user = await db.adminUser.findUnique({ where: { username } })
  if (!user) return null
  const ok = await bcrypt.compare(password, user.passwordHash)
  return ok ? user : null
}

export function signAdminToken(user: { id: string; username: string }) {
  return jwt.sign({ sub: user.id, username: user.username, role: 'admin' }, SECRET, {
    expiresIn: '7d',
  })
}

export function verifyAdminToken(token: string): { sub: string; username: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, SECRET) as { sub: string; username: string; role: string }
    if (decoded.role !== 'admin') return null
    return decoded
  } catch {
    return null
  }
}

export function getAdminFromRequest(req: Request) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.replace(/^Bearer\s+/i, '')
  if (!token) {
    // Also accept cookie token
    const cookie = req.headers.get('cookie') || ''
    const match = cookie.match(/admin_token=([^;]+)/)
    if (match) return verifyAdminToken(decodeURIComponent(match[1]))
    return null
  }
  return verifyAdminToken(token)
}

// ---------- Customer auth ----------

export async function verifyCustomerCredentials(email: string, password: string) {
  const customer = await db.customer.findUnique({ where: { email: email.toLowerCase().trim() } })
  if (!customer) return null
  const ok = await bcrypt.compare(password, customer.passwordHash)
  return ok ? customer : null
}

export function signCustomerToken(customer: { id: string; email: string; name: string }) {
  return jwt.sign({ sub: customer.id, email: customer.email, name: customer.name, role: 'customer' }, SECRET, {
    expiresIn: '30d',
  })
}

export function verifyCustomerToken(token: string): { sub: string; email: string; name: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, SECRET) as { sub: string; email: string; name: string; role: string }
    if (decoded.role !== 'customer') return null
    return decoded
  } catch {
    return null
  }
}

export function getCustomerFromRequest(req: Request) {
  const cookie = req.headers.get('cookie') || ''
  const match = cookie.match(/customer_token=([^;]+)/)
  if (!match) return null
  return verifyCustomerToken(decodeURIComponent(match[1]))
}
