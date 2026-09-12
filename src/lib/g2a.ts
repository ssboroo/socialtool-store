const DEFAULT_G2A_API_URL = 'https://api.g2a.com'

type G2AApiError = {
  error?: {
    code?: string
    message?: string
    status?: number
    errors?: Array<{ field?: string; message?: string }>
  }
  traceId?: string
}

export type G2AOffer = {
  id: string
  price: string
  quantity: number
}

export type G2AProductOffer = {
  id: string
  name: string
  totalQuantity: number
  minPrice: string | null
  updatedAt: string | null
  currency: string
  offers: G2AOffer[]
}

export type G2AProductMetadata = {
  id: string
  name: string
  slug: string
  platform: string | null
  region: string | null
  developer: string | null
  publisher: string | null
  releaseDate: string | null
  categories: Array<{ id: string; name: string }>
  thumbnail: string | null
  portraitImage: string | null
  coverImage: string | null
  images: string[]
  videos: string[]
  totalQuantity: number
  minPrice: string | null
  updatedAt: string | null
  currency: string
}

export type G2AProductOffersPage = {
  data: G2AProductOffer[]
  meta: {
    page: number
    itemsPerPage: number
    totalResults: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

type TokenResponse = {
  access_token: string
  token_type: string
  expires_in: number
}

type TokenCache = { token: string; expiresAt: number } | null
let tokenCache: TokenCache = null

function baseUrl() {
  return (process.env.G2A_API_URL?.trim() || DEFAULT_G2A_API_URL).replace(/\/$/, '')
}

function credentials() {
  const clientId = process.env.G2A_CLIENT_ID?.trim()
  const clientSecret = process.env.G2A_CLIENT_SECRET?.trim()
  if (!clientId || !clientSecret) {
    throw new Error('G2A Export API тохиргоо дутуу байна. G2A_CLIENT_ID болон G2A_CLIENT_SECRET тохируулна уу.')
  }
  return { clientId, clientSecret }
}

export function g2aConfigured() {
  return Boolean(process.env.G2A_CLIENT_ID?.trim() && process.env.G2A_CLIENT_SECRET?.trim())
}

function apiErrorMessage(status: number, body: unknown) {
  const parsed = body as G2AApiError
  const message = parsed?.error?.message
  const code = parsed?.error?.code
  const traceId = parsed?.traceId
  return [code, message || `G2A API HTTP ${status}`, traceId ? `traceId=${traceId}` : null].filter(Boolean).join(' · ')
}

async function readJson(response: Response) {
  const text = await response.text()
  if (!text) return {}
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new Error(`G2A API JSON бус хариу өглөө (HTTP ${response.status})`)
  }
}

export async function getG2AAccessToken() {
  if (tokenCache && Date.now() < tokenCache.expiresAt - 15_000) return tokenCache.token
  const { clientId, clientSecret } = credentials()
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  })
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20_000)
  try {
    const response = await fetch(`${baseUrl()}/oauth/token`, {
      method: 'POST',
      cache: 'no-store',
      signal: controller.signal,
      headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
      body: body.toString(),
    })
    const json = await readJson(response)
    if (!response.ok) throw new Error(apiErrorMessage(response.status, json))
    const token = json as Partial<TokenResponse>
    if (!token.access_token) throw new Error('G2A access_token ирсэнгүй')
    const expiresIn = Math.max(30, Number(token.expires_in) || 300)
    tokenCache = { token: token.access_token, expiresAt: Date.now() + expiresIn * 1000 }
    return token.access_token
  } finally {
    clearTimeout(timeout)
  }
}

async function g2aRequest<T>(path: string, init: RequestInit = {}) {
  const token = await getG2AAccessToken()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 25_000)
  try {
    const response = await fetch(`${baseUrl()}${path}`, {
      ...init,
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${token}`,
        ...(init.body ? { 'content-type': 'application/json' } : {}),
        ...(init.headers || {}),
      },
    })
    const json = await readJson(response)
    if (!response.ok) {
      if (response.status === 401) tokenCache = null
      throw new Error(apiErrorMessage(response.status, json))
    }
    return json as T
  } finally {
    clearTimeout(timeout)
  }
}

export async function getG2AProductOffers(page = 1, itemsPerPage: 10 | 20 | 50 | 100 = 100, updatedAtFrom?: string) {
  const params = new URLSearchParams({ page: String(page), itemsPerPage: String(itemsPerPage) })
  if (updatedAtFrom) params.set('updatedAtFrom', updatedAtFrom)
  return g2aRequest<G2AProductOffersPage>(`/export/v1/product-offers?${params.toString()}`)
}

export async function getG2AProducts(productIds: string[]) {
  const ids = productIds.filter(id => /^\d{14}$/.test(id)).slice(0, 20)
  if (!ids.length) return [] as G2AProductMetadata[]
  const params = new URLSearchParams()
  for (const id of ids) params.append('productIds[]', id)
  const response = await g2aRequest<{ data: G2AProductMetadata[] }>(`/export/v1/products?${params.toString()}`)
  return response.data || []
}

export async function createG2AAutoOrder(input: { productId: string; quantity: number; maxPrice: string; idempotencyKey: string }) {
  return g2aRequest<{ data: { id: string; status: string; totalPrice: string; currency: string } }>('/export/v1/orders', {
    method: 'POST',
    headers: { 'Idempotency-Key': input.idempotencyKey },
    body: JSON.stringify({
      items: [{ auto: { productId: input.productId, quantity: input.quantity, maxPrice: input.maxPrice } }],
      currency: 'EUR',
    }),
  })
}

export async function getG2AOrderKeys(orderId: string) {
  return g2aRequest<{ data: Array<{ item: { id: string }; keys: Array<{ code: string }> }> }>(`/export/v1/orders/${encodeURIComponent(orderId)}/keys`)
}
