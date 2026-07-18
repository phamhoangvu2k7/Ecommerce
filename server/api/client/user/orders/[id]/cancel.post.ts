import { and, eq, sql } from 'drizzle-orm'
import { createError, defineEventHandler, getRouterParam } from 'h3'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Vui lòng đăng nhập để thực hiện hành động này.',
    })
  }

  const id = getRouterParam(event, 'id')
  const orders = await db.select()
    .from(schema.orders)
    .where(and(eq(schema.orders.id, id), eq(schema.orders.user_id, user.id)))
    .limit(1)
  const order = orders[0]

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
    await db.update(schema.orders)
      .set({
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.orders.id, id))

    let orderProducts: any[] = []
    if (typeof order.products === 'string') {
      try {
        orderProducts = JSON.parse(order.products)
      }
      catch {
        orderProducts = []
      }
    }
    else if (Array.isArray(order.products)) {
      orderProducts = order.products
    }

    // Restore stock to warehouse
    for (const item of orderProducts) {
      await db.update(schema.products)
        .set({
          stock: sql`${schema.products.stock} + ${Number(item.quantity)}`,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.products.id, item.product_id))
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
