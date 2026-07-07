import { createError, defineEventHandler, getRouterParam } from 'h3'
import { Product } from '../../../utils/models.ts'

export default defineEventHandler(async (event) => {
  const permissions = event.context.admin?.role_id?.permissions || []
  if (!permissions.includes('products_view')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Bạn không có quyền xem thông tin sản phẩm.',
    })
  }

  const id = getRouterParam(event, 'id')
  const product = await Product.findById(id).populate('product_category_id')
  if (!product) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Không tìm thấy sản phẩm.',
    })
  }

  return {
    success: true,
    product,
  }
})
