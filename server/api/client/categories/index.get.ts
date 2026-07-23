import { defineEventHandler } from 'h3'
import { kv } from 'hub:kv'
import { ProductService } from '../../../utils/services'

export default defineEventHandler(async () => {
  const cacheKey = 'cache:categories'

  // Try to read from KV cache first
  const cachedTree = await kv.get(cacheKey)
  if (cachedTree) {
    return {
      success: true,
      tree: cachedTree,
    }
  }

  // Only return active categories for client-side usage (no auth required)
  const tree = await ProductService.getCategoriesTree({ status: 'active' })

  // Save tree structure to KV with 1 hour TTL (3600 seconds)
  await kv.set(cacheKey, tree, { ttl: 3600 })

  return {
    success: true,
    tree,
  }
})
