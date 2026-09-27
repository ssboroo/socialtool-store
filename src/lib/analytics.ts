export const ANALYTICS_TYPES = [
  'search','product_view','add_to_cart','begin_checkout','order_created','order_paid',
  'wishlist_add','wishlist_remove','assistant_query','assistant_recommendation'
] as const
export type AnalyticsType = typeof ANALYTICS_TYPES[number]
export function validAnalyticsType(value: unknown): value is AnalyticsType {
  return typeof value === 'string' && (ANALYTICS_TYPES as readonly string[]).includes(value)
}
