import { createError, defineEventHandler, getRouterParam } from 'h3'
import { AuditLog } from '../../../utils/models.ts'
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
  const adminId = event.context.admin._id.toString()

  try {
    await ProductService.deleteCategory(id, adminId)

    // Audit log
    const audit = new AuditLog({
      account_id: event.context.admin._id,
      action: 'DELETE_CATEGORY',
      details: `Xóa mềm danh mục sản phẩm (ID: ${id})`,
    })
    await audit.save()

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
