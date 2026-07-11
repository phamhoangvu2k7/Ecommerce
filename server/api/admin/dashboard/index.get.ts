import { createError, defineEventHandler } from 'h3'
import { db, schema } from 'hub:db'
import { eq, and, count, ne } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const permissions = event.context.admin?.role_id?.permissions || []
  if (!permissions.includes('dashboard_view')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Bạn không có quyền truy cập Dashboard.',
    })
  }

  // Query counts in parallel
  const [
    productsActiveCount,
    productsInactiveCount,
    categoriesCount,
    usersCount,
    ordersCount,
    activeOrders,
  ] = await Promise.all([
    db.select({ value: count() }).from(schema.products).where(and(eq(schema.products.status, 'active'), eq(schema.products.deleted, 0))),
    db.select({ value: count() }).from(schema.products).where(and(eq(schema.products.status, 'inactive'), eq(schema.products.deleted, 0))),
    db.select({ value: count() }).from(schema.productCategories).where(eq(schema.productCategories.deleted, 0)),
    db.select({ value: count() }).from(schema.users).where(eq(schema.users.deleted, 0)),
    db.select({ value: count() }).from(schema.orders).where(eq(schema.orders.deleted, 0)),
    db.select().from(schema.orders).where(and(ne(schema.orders.status, 'cancelled'), eq(schema.orders.deleted, 0))),
  ])

  const totalProductsActive = productsActiveCount[0]?.value || 0
  const totalProductsInactive = productsInactiveCount[0]?.value || 0
  const totalCategories = categoriesCount[0]?.value || 0
  const totalUsers = usersCount[0]?.value || 0
  const totalOrders = ordersCount[0]?.value || 0

  // Calculate revenue from active orders
  let totalRevenue = 0
  for (const order of activeOrders) {
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

    for (const item of orderProducts) {
      const price = Number(item.price) || 0
      const discount = Number(item.discountPercentage) || 0
      const quantity = Number(item.quantity) || 0
      const priceAfterDiscount = price * (1 - discount / 100)
      totalRevenue += priceAfterDiscount * quantity
    }
  }

  return {
    success: true,
    data: {
      products: {
        active: totalProductsActive,
        inactive: totalProductsInactive,
        total: totalProductsActive + totalProductsInactive,
      },
      categoriesCount: totalCategories,
      usersCount: totalUsers,
      orders: {
        total: totalOrders,
        revenue: Math.round(totalRevenue),
      },
    },
  }
})
