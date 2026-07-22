import { and, eq } from 'drizzle-orm'
import { createError, defineEventHandler, getRouterParam } from 'h3'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID sản phẩm không hợp lệ.',
    })
  }

  const rows = await db.select({
    product: schema.products,
    category: schema.productCategories,
  })
    .from(schema.products)
    .leftJoin(schema.productCategories, eq(schema.products.product_category_id, schema.productCategories.id))
    .where(and(
      eq(schema.products.id, id),
      eq(schema.products.status, 'active'),
      eq(schema.products.deleted, 0),
    ))
    .limit(1)

  const row = rows[0]
  if (!row) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Không tìm thấy sản phẩm hoặc sản phẩm đã ngừng kinh doanh.',
    })
  }

  const priceNew = Math.round(row.product.price! * (1 - (row.product.discountPercentage! || 0) / 100))

  const productData = {
    ...row.product,
    product_category_id: row.category || null,
    priceNew,
  }

  return {
    success: true,
    product: productData,
  }
})
