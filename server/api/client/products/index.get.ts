import { defineEventHandler, getQuery } from 'h3'
import { kv } from 'hub:kv'
import { ProductService } from '../../../utils/services'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  // Only cache if there's no search query 'q' (search is dynamic)
  const shouldCache = !query.q

  // Format safe key for Windows filesystem (avoid quotes `"`, `{}` in KV keys)
  const queryPairs = Object.keys(query)
    .sort()
    .map(k => `${k}_${String(query[k]).replace(/[^\w-]/g, '')}`)
    .join('_')
  const cacheKey = queryPairs ? `cache:products:list:${queryPairs}` : 'cache:products:list:default'

  if (shouldCache) {
    const cachedData = await kv.get(cacheKey)
    if (cachedData) {
      return {
        success: true,
        data: cachedData,
      }
    }
  }

  const data = await ProductService.getProductsClient(query)

  if (shouldCache) {
    // Cache products list for 10 minutes (600 seconds)
    await kv.set(cacheKey, data, { ttl: 600 })
  }

  return {
    success: true,
    data,
  }
})
