import { createError, defineEventHandler } from 'h3'
import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const permissions = event.context.admin?.role_id?.permissions || []
  if (!permissions.includes('trash_view')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Bạn không có quyền xem dữ liệu trong Thùng rác.',
    })
  }

  const [productRows, categories] = await Promise.all([
    db.select({
      product: schema.products,
      category: schema.productCategories,
    })
    .from(schema.products)
    .leftJoin(schema.productCategories, eq(schema.products.product_category_id, schema.productCategories.id))
    .where(eq(schema.products.deleted, 1)),

    db.select()
      .from(schema.productCategories)
      .where(eq(schema.productCategories.deleted, 1)),
  ])

  const products = productRows.map(row => ({
    ...row.product,
    product_category_id: row.category || null,
  }))

  return {
    success: true,
    products,
    categories,
  }
})
