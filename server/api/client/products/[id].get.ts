import { createError, defineEventHandler, getRouterParam } from 'h3'
import { ProductService } from '../../../services/product.service'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID sản phẩm không hợp lệ.',
    })
  }

  const row = await ProductService.getProductById(id)
  if (!row) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Không tìm thấy sản phẩm hoặc sản phẩm đã ngừng kinh doanh.',
    })
  }

  const priceNew = Math.round(row.product.price! * (1 - (row.product.discountPercentage! || 0) / 100))

  const productData = {
    ...row.product,
    product_category_id: row.category || null,
    priceNew,
  }

  return {
    success: true,
    product: productData,
  }
})
