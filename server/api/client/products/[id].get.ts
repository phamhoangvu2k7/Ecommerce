import { createError, defineEventHandler, getRouterParam } from 'h3'
import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  const rows = await db.select({
    product: schema.products,
    category: schema.productCategories,
  })
  .from(schema.products)
  .leftJoin(schema.productCategories, eq(schema.products.product_category_id, schema.productCategories.id))
  .where(and(
    eq(schema.products.id, id),
    eq(schema.products.status, 'active'),
    eq(schema.products.deleted, 0)
  ))
  .limit(1)

  const row = rows[0]
  if (!row) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Không tìm thấy sản phẩm hoặc sản phẩm đã ngừng kinh doanh.',
    })
  }

  const p: any = {
    ...row.product,
    product_category_id: row.category || null,
  }
  p.priceNew = Math.round(p.price * (1 - p.discountPercentage / 100))

  return {
    success: true,
    product: p,
  }
})
