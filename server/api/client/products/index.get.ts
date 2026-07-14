import { defineEventHandler, getQuery } from 'h3'
import { kv } from 'hub:kv'
import { ProductService } from '../../../utils/services'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  // Only cache if there's no search query 'q' (search is dynamic)
  const shouldCache = !query.q
  const cacheKey = `cache:products:list:${JSON.stringify(query)}`

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
