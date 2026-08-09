import { createError, defineEventHandler } from 'h3'
import { AdminService } from '../../../services/admin.service'

export default defineEventHandler(async (event) => {
  const permissions = event.context.admin?.role_id?.permissions || []
  if (!permissions.includes('dashboard_view')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Bạn không có quyền truy cập Dashboard.',
    })
  }

  const data = await AdminService.getDashboardStats()

  return {
    success: true,
    data,
  }
})

