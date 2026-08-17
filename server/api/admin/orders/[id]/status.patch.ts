import { eq, sql } from 'drizzle-orm'
import { createError, defineEventHandler, readBody } from 'h3'
import { db, schema } from 'hub:db'

const VALID_STATUSES = ['pending', 'processing', 'shipping', 'completed', 'cancelled']

export default defineEventHandler(async (event) => {
  if (!event.context.admin) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Yêu cầu quyền đăng nhập Admin.',
    })
  }

  const id = event.context.params?.id
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Thiếu mã đơn hàng.',
    })
  }

  const body = await readBody(event)
  const newStatus = body?.status

  if (!newStatus || !VALID_STATUSES.includes(newStatus)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Trạng thái không hợp lệ. Các trạng thái cho phép: ${VALID_STATUSES.join(', ')}`,
    })
  }

  // Find order
  const existingOrders = await db.select()
    .from(schema.orders)
    .where(eq(schema.orders.id, id))
    .limit(1)

  const order = existingOrders[0]
  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Không tìm thấy đơn hàng.',
    })
  }

  const oldStatus = order.status

  // If changing status to 'cancelled' from non-cancelled status, restore product inventory
  if (oldStatus !== 'cancelled' && newStatus === 'cancelled') {
    let products = []
    try {
      products = typeof order.products === 'string' ? JSON.parse(order.products) : order.products
    }
    catch {
      products = []
    }

    if (Array.isArray(products)) {
      for (const item of products) {
        if (item.id && item.quantity) {
          await db.update(schema.products)
            .set({
              stock: sql`${schema.products.stock} + ${item.quantity}`,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(schema.products.id, item.id))
        }
      }
    }
  }

  // Update order status
  await db.update(schema.orders)
    .set({
      status: newStatus,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.orders.id, id))

  return {
    success: true,
    message: `Cập nhật trạng thái đơn hàng thành: ${newStatus}`,
  }
})
