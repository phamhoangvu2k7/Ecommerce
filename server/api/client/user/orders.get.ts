import { createError, defineEventHandler } from 'h3'
import { db, schema } from 'hub:db'
import { eq, and, desc, inArray } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Vui lòng đăng nhập để xem lịch sử đơn hàng.',
    })
  }

  const orders = await db.select()
    .from(schema.orders)
    .where(and(eq(schema.orders.user_id, user.id), eq(schema.orders.deleted, 0)))
    .orderBy(desc(schema.orders.createdAt))

  const parsedOrders = orders.map(order => {
    let orderProducts: any[] = []
    if (typeof order.products === 'string') {
      try {
        orderProducts = JSON.parse(order.products)
      } catch {
        orderProducts = []
      }
    } else if (Array.isArray(order.products)) {
      orderProducts = order.products
    }

    let userInfo: any = {}
    if (typeof order.userInfo === 'string') {
      try {
        userInfo = JSON.parse(order.userInfo)
      } catch {
        userInfo = {}
      }
    } else if (order.userInfo) {
      userInfo = order.userInfo
    }

    return {
      ...order,
      products: orderProducts,
      userInfo,
    }
  })

  const productIds = [...new Set(parsedOrders.flatMap(o => o.products.map((p: any) => p.product_id)).filter(Boolean))] as string[]
  if (productIds.length > 0) {
    const products = await db.select()
      .from(schema.products)
      .where(inArray(schema.products.id, productIds))
    const productMap = new Map(products.map(p => [p.id, p]))

    parsedOrders.forEach(o => {
      o.products.forEach((p: any) => {
        p.product_id = productMap.get(p.product_id) || null
      })
    })
  }

  return {
    success: true,
    orders: parsedOrders,
  }
})
