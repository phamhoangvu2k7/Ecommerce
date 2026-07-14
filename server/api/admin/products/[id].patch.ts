import { and, eq } from 'drizzle-orm'
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { db, schema } from 'hub:db'
import { slugify } from '../../../utils/helpers'
import { ProductService } from '../../../utils/services'
import { ProductValidation } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const permissions = event.context.admin?.role_id?.permissions || []
  if (!permissions.includes('products_edit')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Bạn không có quyền chỉnh sửa sản phẩm.',
    })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Thiếu ID sản phẩm.',
    })
  }

  const body = await readBody(event)

  // Validate fields
  const parsed = ProductValidation.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.errors.map(e => e.message).join(', '),
    })
  }

  const prods = await db.select()
    .from(schema.products)
    .where(and(eq(schema.products.id, id), eq(schema.products.deleted, 0)))
    .limit(1)
  const product = prods[0]

  if (!product) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Không tìm thấy sản phẩm để cập nhật.',
    })
  }

  const updateData = {
    ...parsed.data,
    slug: slugify(parsed.data.title),
    updatedBy: event.context.admin.id,
    updatedAt: new Date().toISOString(),
  }

  await db.update(schema.products)
    .set(updateData)
    .where(eq(schema.products.id, id))

  // Invalidate products cache
  await ProductService.invalidateProductsCache()

  const updatedProds = await db.select()
    .from(schema.products)
    .where(eq(schema.products.id, id))
    .limit(1)
  const updatedProduct = updatedProds[0]

  // Log activity
  await db.insert(schema.auditLogs).values({
    id: crypto.randomUUID(),
    account_id: event.context.admin.id,
    action: 'UPDATE_PRODUCT',
    details: `Cập nhật sản phẩm: ${updatedProduct?.title} (ID: ${id})`,
    timestamp: new Date().toISOString(),
  })

  return {
    success: true,
    message: 'Cập nhật sản phẩm thành công.',
    product: updatedProduct,
  }
})
