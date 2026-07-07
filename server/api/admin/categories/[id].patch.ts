import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { slugify } from '../../../utils/helpers.ts'
import { AuditLog, ProductCategory } from '../../../utils/models.ts'
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
      statusMessage: 'Danh mục cha không thể là chính nó.',
    })
  }

  const category = await ProductCategory.findOneAndUpdate(
    { _id: id },
    {
      ...parsed.data,
      slug: slugify(parsed.data.title),
      updatedBy: event.context.admin._id,
    },
    { new: true },
  )

  if (!category) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Không tìm thấy danh mục để cập nhật.',
    })
  }

  // Log activity
  const audit = new AuditLog({
    account_id: event.context.admin._id,
    action: 'UPDATE_CATEGORY',
    details: `Cập nhật danh mục: ${category.title} (ID: ${category._id})`,
  })
  await audit.save()

  return {
    success: true,
    message: 'Cập nhật danh mục sản phẩm thành công.',
    category,
  }
})
