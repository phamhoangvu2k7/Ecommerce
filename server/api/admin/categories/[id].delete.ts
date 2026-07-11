import { createError, defineEventHandler, getRouterParam } from 'h3'
import { db, schema } from 'hub:db'
import { ProductService } from '../../../utils/services.ts'

export default defineEventHandler(async (event) => {
  const permissions = event.context.admin?.role_id?.permissions || []
  if (!permissions.includes('categories_delete')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Bạn không có quyền xóa danh mục sản phẩm.',
    })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Thiếu ID danh mục.',
    })
  }
  const adminId = event.context.admin.id

  try {
    await ProductService.deleteCategory(id, adminId)

    // Audit log
    await db.insert(schema.auditLogs).values({
      id: crypto.randomUUID(),
      account_id: adminId,
      action: 'DELETE_CATEGORY',
      details: `Xóa mềm danh mục sản phẩm (ID: ${id})`,
      timestamp: new Date().toISOString(),
    })

    return {
      success: true,
      message: 'Xóa danh mục sản phẩm thành công (đã chuyển vào Thùng rác).',
    }
  }
  catch (err: any) {
    throw createError({
      statusCode: 400,
      statusMessage: err.message,
    })
  }
})
