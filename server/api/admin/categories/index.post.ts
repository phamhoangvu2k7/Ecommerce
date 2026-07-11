import { createError, defineEventHandler, readBody } from 'h3'
import { slugify } from '../../../utils/helpers.ts'
import { db, schema } from 'hub:db'
import { eq, and, desc, isNull } from 'drizzle-orm'
import { ProductCategoryValidation } from '../../../utils/validation.ts'

export default defineEventHandler(async (event) => {
  const permissions = event.context.admin?.role_id?.permissions || []
  if (!permissions.includes('categories_create')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Bạn không có quyền tạo danh mục sản phẩm.',
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

  let position = parsed.data.position
  if (!position) {
    const parentId = parsed.data.parent_id || null
    const conditions: any[] = [eq(schema.productCategories.deleted, 0)]
    if (parentId === null) {
      conditions.push(isNull(schema.productCategories.parent_id))
    } else {
      conditions.push(eq(schema.productCategories.parent_id, parentId))
    }
    const lastCategories = await db.select()
      .from(schema.productCategories)
      .where(and(...conditions))
      .orderBy(desc(schema.productCategories.position))
      .limit(1)
    const lastCategory = lastCategories[0]
    position = lastCategory ? (lastCategory.position || 0) + 1 : 1
  }

  const categoryId = crypto.randomUUID()
  const slug = slugify(parsed.data.title)
  const categoryData = {
    id: categoryId,
    title: parsed.data.title,
    parent_id: parsed.data.parent_id || null,
    slug,
    description: parsed.data.description || '',
    status: parsed.data.status || 'active',
    position,
    deleted: 0,
    createdBy: event.context.admin.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  await db.insert(schema.productCategories).values(categoryData)

  // Audit log
  await db.insert(schema.auditLogs).values({
    id: crypto.randomUUID(),
    account_id: event.context.admin.id,
    action: 'CREATE_CATEGORY',
    details: `Tạo danh mục: ${categoryData.title} (ID: ${categoryId})`,
    timestamp: new Date().toISOString(),
  })

  return {
    success: true,
    message: 'Tạo danh mục mới thành công.',
    category: categoryData,
  }
})
