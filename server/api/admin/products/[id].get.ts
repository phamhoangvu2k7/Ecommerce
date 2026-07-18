import { and, eq } from 'drizzle-orm'
import { createError, defineEventHandler, getRouterParam } from 'h3'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  const permissions = event.context.admin?.role_id?.permissions || []
  if (!permissions.includes('products_view')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Bạn không có quyền xem thông tin sản phẩm.',
    })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Thiếu ID sản phẩm.',
    })
  }

  const rows = await db.select({
    product: schema.products,
    category: schema.productCategories,
  })
    .from(schema.products)
    .leftJoin(schema.productCategories, eq(schema.products.product_category_id, schema.productCategories.id))
    .where(and(eq(schema.products.id, id), eq(schema.products.deleted, 0)))
    .limit(1)

  const row = rows[0]
  if (!row) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Không tìm thấy sản phẩm.',
    })
  }

  return {
    success: true,
    product: {
      ...row.product,
      product_category_id: row.category || null,
    },
  }
})
