import { tool } from 'ai'
import { and, eq, gt, gte, like, lte, or } from 'drizzle-orm'
import { db } from 'hub:db'
import { z } from 'zod'
import { productCategories, products } from '~/server/db/schema'

export const aiTools = {
  // Tool 1: Tìm kiếm & Lọc sản phẩm (Theo từ khóa, danh mục, khoảng giá, còn hàng)
  searchProducts: tool({
    description: 'Tìm kiếm và lọc danh sách sản phẩm theo từ khóa (tên/mô tả), danh mục, khoảng giá tiền (giá tối thiểu / giá tối đa), hoặc tình trạng còn hàng.',
    inputSchema: z.object({
      keyword: z.string().optional().describe('Từ khóa tìm kiếm tên hoặc mô tả sản phẩm'),
      categoryId: z.string().optional().describe('ID danh mục sản phẩm'),
      minPrice: z.number().optional().describe('Mức giá tối thiểu (VNĐ)'),
      maxPrice: z.number().optional().describe('Mức giá tối đa (VNĐ)'),
      inStockOnly: z.boolean().optional().describe('Đặt true nếu chỉ muốn tìm các sản phẩm còn hàng trong kho (stock > 0)'),
      limit: z.number().default(5).describe('Số lượng sản phẩm tối đa trả về (mặc định 5)'),
    }),
    execute: async ({ keyword, categoryId, minPrice, maxPrice, inStockOnly, limit }) => {
      const conditions = [eq(products.deleted, 0), eq(products.status, 'active')]

      if (keyword) {
        conditions.push(
          or(
            like(products.title, `%${keyword}%`),
            like(products.description, `%${keyword}%`),
          )!,
        )
      }

      if (categoryId) {
        conditions.push(eq(products.product_category_id, categoryId))
      }

      if (minPrice !== undefined) {
        conditions.push(gte(products.price, minPrice))
      }

      if (maxPrice !== undefined) {
        conditions.push(lte(products.price, maxPrice))
      }

      if (inStockOnly) {
        conditions.push(gt(products.stock, 0))
      }

      const items = await db
        .select({
          id: products.id,
          title: products.title,
          price: products.price,
          discountPercentage: products.discountPercentage,
          stock: products.stock,
          slug: products.slug,
          description: products.description,
        })
        .from(products)
        .where(and(...conditions))
        .limit(limit)

      return items
    },
  }),

  // Tool 2: Lấy thông tin danh mục sản phẩm
  getCategories: tool({
    description: 'Lấy danh sách tất cả các danh mục sản phẩm trong cửa hàng.',
    inputSchema: z.object({}),
    execute: async () => {
      return await db
        .select({
          id: productCategories.id,
          title: productCategories.title,
          slug: productCategories.slug,
        })
        .from(productCategories)
        .where(eq(productCategories.deleted, 0))
    },
  }),

  // Tool 3: Tra cứu chi tiết 1 sản phẩm theo Slug/ID
  getProductDetails: tool({
    description: 'Xem chi tiết thông tin, giá bán và tồn kho của một sản phẩm cụ thể.',
    inputSchema: z.object({
      productId: z.string().describe('ID hoặc Slug của sản phẩm'),
    }),
    execute: async ({ productId }) => {
      const result = await db
        .select()
        .from(products)
        .where(
          and(
            or(eq(products.id, productId), eq(products.slug, productId)),
            eq(products.deleted, 0),
          ),
        )
        .limit(1)

      if (!result.length)
        return { error: 'Không tìm thấy sản phẩm này' }
      return result[0]
    },
  }),
}
