import { desc, eq } from 'drizzle-orm'
import { createError, defineEventHandler, getQuery } from 'h3'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  if (!event.context.admin) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Yêu cầu quyền đăng nhập Admin.',
    })
  }

  const query = getQuery(event)
  const statusFilter = query.status as string | undefined

  let ordersList
  if (statusFilter && statusFilter !== 'all') {
    ordersList = await db.select()
      .from(schema.orders)
      .where(eq(schema.orders.status, statusFilter))
      .orderBy(desc(schema.orders.createdAt))
  }
  else {
    ordersList = await db.select()
      .from(schema.orders)
      .orderBy(desc(schema.orders.createdAt))
  }

  // Parse JSON fields (products, userInfo)
  const formattedOrders = ordersList.map((order) => {
    let parsedProducts = []
    let parsedUserInfo = null

    try {
      parsedProducts = typeof order.products === 'string' ? JSON.parse(order.products) : order.products
    }
    catch {
      parsedProducts = []
    }

    try {
      parsedUserInfo = typeof order.userInfo === 'string' ? JSON.parse(order.userInfo) : order.userInfo
    }
    catch {
      parsedUserInfo = null
    }

    return {
      ...order,
      products: parsedProducts,
      userInfo: parsedUserInfo,
    }
  })

  return {
    success: true,
    orders: formattedOrders,
  }
})
