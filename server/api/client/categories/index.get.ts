import { defineEventHandler } from 'h3'
import { ProductService } from '../../../utils/services.ts'

export default defineEventHandler(async () => {
  // Only return active categories for client-side usage (no auth required)
  const tree = await ProductService.getCategoriesTree({ status: 'active' })

  return {
    success: true,
    tree,
  }
})
