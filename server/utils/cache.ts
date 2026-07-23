/**
 * Generates a safe, normalized cache key from request query parameters.
 * Sorts query keys alphabetically and strips special characters to avoid invalid KV/filesystem keys.
 *
 * @param prefix Namespace for the cache key (e.g., 'products:list')
 * @param query Query object from request (e.g., getQuery(event))
 */
export function generateCacheKey(prefix: string, query: Record<string, any> = {}): string {
  const queryPairs = Object.keys(query)
    .sort()
    .map(k => `${k}_${String(query[k]).replace(/[^\w-]/g, '')}`)
    .join('_')

  return queryPairs ? `cache:${prefix}:${queryPairs}` : `cache:${prefix}:default`
}
