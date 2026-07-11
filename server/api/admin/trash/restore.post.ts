import { createError, defineEventHandler, readBody } from 'h3'
import { db, schema } from 'hub:db'
import { ProductService } from '../../../utils/services.ts'

export default defineEventHandler(async (event) => {
  const permissions = event.context.admin?.role_id?.permissions || []
  if (!permissions.includes('trash_restore')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Bạn không có quyền khôi phục dữ liệu từ Thùng rác.',
    })
  }

  const body = await readBody(event)
  const { type, id } = body

  if (!id || !type) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Yêu cầu cung cấp ID và Loại (product/category) cần khôi phục.',
    })
  }

  try {
    if (type === 'product') {
      await ProductService.restoreProduct(id)
    }
    else if (type === 'category') {
      await ProductService.restoreCategory(id)
    }
    else {
      throw new Error('Loại đối tượng khôi phục không hợp lệ.')
    }

    // Log activity
    await db.insert(schema.auditLogs).values({
      id: crypto.randomUUID(),
      account_id: event.context.admin.id,
      action: 'RESTORE_DATA',
      details: `Khôi phục thành công ${type === 'product' ? 'sản phẩm' : 'danh mục'} (ID: ${id})`,
      timestamp: new Date().toISOString(),
    })

    return {
      success: true,
      message: 'Khôi phục dữ liệu thành công.',
    }
  }
  catch (err: any) {
    throw createError({
      statusCode: 400,
      statusMessage: err.message,
    })
  }
})
