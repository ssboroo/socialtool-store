import { createHmac } from 'node:crypto'

const G2G_BASE_URL = 'https://open-api.g2g.com'

export type G2GService = {
  service_id: string
  service_name: string
  delivery_method?: string
  categories?: Array<{
    category_id?: string
    category_name: string
    sub_categories?: Array<{ category_id: string; category_name: string }>
  }>
}

export type G2GBrand = { brand_id: string; brand_name: string }
export type G2GProduct = {
  service_id?: string
  service_name?: string
  brand_id?: string
  brand_name?: string
  product_id: string
  product_name: string
  region_name?: string
}

type ApiEnvelope<T> = {
  code?: number
  message?: string
  warning?: string
  request_id?: string
  payload: T
}

function credentials() {
  const apiKey = process.env.G2G_API_KEY?.trim()
  const secretKey = process.env.G2G_SECRET_KEY?.trim()
  const userId = process.env.G2G_USER_ID?.trim()
  if (!apiKey || !secretKey || !userId) {
    throw new Error('G2G API тохиргоо дутуу байна. G2G_API_KEY, G2G_SECRET_KEY, G2G_USER_ID тохируулна уу.')
  }
  return { apiKey, secretKey, userId }
}

export function g2gConfigured() {
  return Boolean(process.env.G2G_API_KEY?.trim() && process.env.G2G_SECRET_KEY?.trim() && process.env.G2G_USER_ID?.trim())
}

// G2G official Postman sample signs: path + api_key + user_id + timestamp.
export function createG2GSignature(path: string, timestamp: string, apiKey: string, userId: string, secretKey: string) {
  return createHmac('sha256', secretKey)
    .update(`${path}${apiKey}${userId}${timestamp}`)
    .digest('hex')
}

async function g2gGet<T>(path: string, params: Record<string, string | undefined> = {}) {
  const { apiKey, secretKey, userId } = credentials()
  const timestamp = Date.now().toString()
  const signature = createG2GSignature(path, timestamp, apiKey, userId, secretKey)
  const url = new URL(`${G2G_BASE_URL}${path}`)
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20_000)
  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        accept: 'application/json',
        'g2g-api-key': apiKey,
        'g2g-userid': userId,
        'g2g-signature': signature,
        'g2g-timestamp': timestamp,
      },
    })
    const text = await response.text()
    let data: ApiEnvelope<T>
    try {
      data = JSON.parse(text) as ApiEnvelope<T>
    } catch {
      throw new Error(`G2G API JSON бус хариу өглөө (HTTP ${response.status})`)
    }
    if (!response.ok || (typeof data.code === 'number' && data.code !== 20000001)) {
      throw new Error(data.message || data.warning || `G2G API HTTP ${response.status}`)
    }
    return data
  } finally {
    clearTimeout(timeout)
  }
}

export async function getG2GServices() {
  const data = await g2gGet<{ service_list?: G2GService[] }>('/v2/services')
  return data.payload.service_list || []
}

export async function getG2GBrands(serviceId: string, after?: string, q?: string) {
  const path = `/v2/services/${encodeURIComponent(serviceId)}/brands`
  const data = await g2gGet<{ service_id?: string; brand_list?: G2GBrand[]; after?: string }>(path, {
    after,
    q,
  })
  return {
    brands: data.payload.brand_list || [],
    after: data.payload.after || '',
  }
}

export async function getG2GProducts(serviceId: string, brandId: string, categoryId?: string) {
  const data = await g2gGet<{ product_list?: G2GProduct[] }>('/v2/products', {
    service_id: serviceId,
    brand_id: brandId,
    category_id: categoryId,
  })
  return data.payload.product_list || []
}
