import { createError, defineEventHandler, getQuery } from 'h3'
import { ProductService } from '../../../utils/services.ts'

export default defineEventHandler(async (event) => {
  const permissions = event.context.admin?.role_id?.permissions || []
  if (!permissions.includes('categories_view')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Bạn không có quyền xem danh mục sản phẩm.',
    })
  }

  const query = getQuery(event)
  const filter: any = {}
  if (query.status === 'active' || query.status === 'inactive') {
    filter.status = query.status
  }

  const tree = await ProductService.getCategoriesTree(filter)

  return {
    success: true,
    tree,
  }
})
