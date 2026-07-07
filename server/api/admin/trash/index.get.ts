import { createError, defineEventHandler } from 'h3'
import { Product, ProductCategory } from '../../../utils/models.ts'

export default defineEventHandler(async (event) => {
  const permissions = event.context.admin?.role_id?.permissions || []
  if (!permissions.includes('trash_view')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Bạn không có quyền xem dữ liệu trong Thùng rác.',
    })
  }

  // Querying with { deleted: true } overrides the softDelete query filter
  const [products, categories] = await Promise.all([
    Product.find({ deleted: true }).populate('product_category_id'),
    ProductCategory.find({ deleted: true }),
  ])

  return {
    success: true,
    products,
    categories,
  }
})
