import { createError, defineEventHandler, getRouterParam } from 'h3'
import { Order, Product } from '../../../../../utils/models.ts'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Vui lòng đăng nhập để thực hiện hành động này.',
    })
  }

  const id = getRouterParam(event, 'id')
  const order = await Order.findOne({ _id: id, user_id: user._id })

  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Không tìm thấy đơn hàng của bạn.',
    })
  }

  if (order.status !== 'pending') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Chỉ có thể hủy đơn hàng ở trạng thái \'Chờ xác nhận\' (pending).',
    })
  }

  try {
    order.status = 'cancelled'
    await order.save()

    // Restore stock to warehouse
    for (const item of order.products) {
      await Product.updateOne(
        { _id: item.product_id },
        { $inc: { stock: item.quantity } },
      )
    }

    return {
      success: true,
      message: 'Hủy đơn hàng và hoàn trả số lượng sản phẩm về kho thành công.',
    }
  }
  catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Hủy đơn hàng thất bại: ${err.message}`,
    })
  }
})
