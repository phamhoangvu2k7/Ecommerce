import { defineEventHandler, getQuery } from 'h3'
import { ProductService } from '../../../utils/services.ts'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const data = await ProductService.getProductsClient(query)
  return {
    success: true,
    data,
  }
})
