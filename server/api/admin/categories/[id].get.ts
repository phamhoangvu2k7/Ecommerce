import { and, eq } from 'drizzle-orm'
import { createError, defineEventHandler, getRouterParam } from 'h3'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  const permissions = event.context.admin?.role_id?.permissions || []
  if (!permissions.includes('categories_view')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Bạn không có quyền xem thông tin danh mục sản phẩm.',
    })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Thiếu ID danh mục.',
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
      statusMessage: 'Không tìm thấy danh mục sản phẩm.',
    })
  }

  // Populate parent_id
  let parent: any = null
  if (category.parent_id) {
    const parents = await db.select()
      .from(schema.productCategories)
      .where(and(eq(schema.productCategories.id, category.parent_id), eq(schema.productCategories.deleted, 0)))
      .limit(1)
    parent = parents[0] || null
  }

  return {
    success: true,
    category: {
      ...category,
      parent_id: parent,
    },
  }
})
