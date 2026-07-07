import { createError, defineEventHandler, getRouterParam } from 'h3'
import { Product } from '../../../utils/models.ts'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const product = await Product.findOne({ _id: id, status: 'active' }).populate('product_category_id')

  if (!product) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Không tìm thấy sản phẩm hoặc sản phẩm đã ngừng kinh doanh.',
    })
  }

  const p = product.toObject()
  p.priceNew = Math.round(p.price * (1 - p.discountPercentage / 100))

  return {
    success: true,
    product: p,
  }
})
