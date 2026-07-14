import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { slugify } from '../../../utils/helpers.ts'
import { db, schema } from 'hub:db'
import { kv } from 'hub:kv'
import { eq, and } from 'drizzle-orm'
import { ProductCategoryValidation } from '../../../utils/validation.ts'

export default defineEventHandler(async (event) => {
  const permissions = event.context.admin?.role_id?.permissions || []
  if (!permissions.includes('categories_edit')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Bạn không có quyền chỉnh sửa danh mục sản phẩm.',
    })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Thiếu ID danh mục.',
    })
  }

  const body = await readBody(event)

  const parsed = ProductCategoryValidation.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.errors.map(e => e.message).join(', '),
    })
  }

  // Prevent self-parent loop
  if (parsed.data.parent_id === id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Danh mục chi tiết không thể liên kết với chính nó.',
    })
  }

  const cats = await db.select()
    .from(schema.productCategories)
    .where(and(eq(schema.productCategories.id, id), eq(schema.productCategories.deleted, 0)))
    .limit(1)
  const category = cats[0]

  if (!category) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Không tìm thấy danh mục để cập nhật.',
    })
  }

  const updateData = {
    ...parsed.data,
    slug: slugify(parsed.data.title),
    updatedBy: event.context.admin.id,
    updatedAt: new Date().toISOString(),
  }

  await db.update(schema.productCategories)
    .set(updateData)
    .where(eq(schema.productCategories.id, id))

  // Invalidate categories cache in KV
  await kv.del('cache:categories')

  const updatedCats = await db.select()
    .from(schema.productCategories)
    .where(eq(schema.productCategories.id, id))
    .limit(1)
  const updatedCategory = updatedCats[0]

  // Log activity
  await db.insert(schema.auditLogs).values({
    id: crypto.randomUUID(),
    account_id: event.context.admin.id,
    action: 'UPDATE_CATEGORY',
    details: `Cập nhật danh mục: ${updatedCategory?.title} (ID: ${id})`,
    timestamp: new Date().toISOString(),
  })

  return {
    success: true,
    message: 'Cập nhật danh mục sản phẩm thành công.',
    category: updatedCategory,
  }
})
