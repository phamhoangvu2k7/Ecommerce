import { and, desc, eq } from 'drizzle-orm'
import { createError, defineEventHandler, readBody } from 'h3'
import { db, schema } from 'hub:db'
import { slugify } from '../../../utils/helpers'
import { ProductService } from '../../../utils/services'
import { ProductValidation } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  // Check permission
  const permissions = event.context.admin?.role_id?.permissions || []
  if (!permissions.includes('products_create')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Bạn không có quyền tạo sản phẩm.',
    })
  }

  const body = await readBody(event)
  const parsed = ProductValidation.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.errors.map(e => e.message).join(', '),
    })
  }

  // If position is not custom set, auto-increment based on max position
  let position = parsed.data.position
  if (!position) {
    const lastProducts = await db.select()
      .from(schema.products)
      .where(eq(schema.products.deleted, 0))
      .orderBy(desc(schema.products.position))
      .limit(1)
    const lastProduct = lastProducts[0]
    position = lastProduct ? (lastProduct.position || 0) + 1 : 1
  }

  const productId = crypto.randomUUID()
  const slug = slugify(parsed.data.title)
  const productData = {
    id: productId,
    title: parsed.data.title,
    slug,
    product_category_id: parsed.data.product_category_id || null,
    description: parsed.data.description || '',
    price: parsed.data.price || 0,
    discountPercentage: parsed.data.discountPercentage || 0,
    stock: parsed.data.stock || 0,
    thumbnail: parsed.data.thumbnail || '',
    status: parsed.data.status || 'active',
    position,
    deleted: 0,
    createdBy: event.context.admin.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  await db.insert(schema.products).values(productData)

  // Invalidate products cache
  await ProductService.invalidateProductsCache()

  // Log activity
  await db.insert(schema.auditLogs).values({
    id: crypto.randomUUID(),
    account_id: event.context.admin.id,
    action: 'CREATE_PRODUCT',
    details: `Tạo sản phẩm mới: ${productData.title} (ID: ${productId})`,
    timestamp: new Date().toISOString(),
  })

  return {
    success: true,
    message: 'Tạo sản phẩm mới thành công.',
    product: productData,
  }
})
