import { createError, defineEventHandler } from 'h3'
import { Order } from '../../../utils/models.ts'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Vui lòng đăng nhập để xem lịch sử đơn hàng.',
    })
  }

  const orders = await Order.find({ user_id: user._id })
    .populate('products.product_id')
    .sort({ createdAt: 'desc' })

  return {
    success: true,
    orders,
  }
})
