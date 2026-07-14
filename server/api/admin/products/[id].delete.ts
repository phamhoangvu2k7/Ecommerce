import { createError, defineEventHandler, getRouterParam } from 'h3'
import { db, schema } from 'hub:db'
import { ProductService } from '../../../utils/services'

export default defineEventHandler(async (event) => {
  const permissions = event.context.admin?.role_id?.permissions || []
  if (!permissions.includes('products_delete')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Bạn không có quyền xóa sản phẩm.',
    })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Thiếu ID sản phẩm.',
    })
  }
  const adminId = event.context.admin.id

  await ProductService.deleteProduct(id, adminId)

  // Invalidate products cache
  await ProductService.invalidateProductsCache()

  // Log activity
  await db.insert(schema.auditLogs).values({
    id: crypto.randomUUID(),
    account_id: adminId,
    action: 'DELETE_PRODUCT',
    details: `Xóa mềm sản phẩm (ID: ${id})`,
    timestamp: new Date().toISOString(),
  })

  return {
    success: true,
    message: 'Xóa sản phẩm thành công (đã chuyển vào Thùng rác).',
  }
})
