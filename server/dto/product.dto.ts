import { z } from 'zod'
import { stripImageDomain } from '../utils/helpers'

// ==========================================
// Product DTO
// ==========================================
export const ProductValidation = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  product_category_id: z.string().nullable().optional(),
  description: z.string().optional(),
  price: z.preprocess(val => Number(val), z.number().min(0, 'Giá phải lớn hơn hoặc bằng 0')),
  discountPercentage: z.preprocess(val => Number(val), z.number().min(0).max(100).optional().default(0)),
  stock: z.preprocess(val => Number(val), z.number().int().min(0, 'Số lượng kho phải là số nguyên >= 0')),
  thumbnail: z.string().optional().transform(val => val ? stripImageDomain(val) : val),
  status: z.enum(['active', 'inactive']).optional().default('active'),
  position: z.preprocess(val => Number(val), z.number().int().optional().default(0)),
})
export const ProductInputSchema = ProductValidation
export type ProductInputDTO = z.infer<typeof ProductInputSchema>

// ==========================================
// Product Category DTO
// ==========================================
export const ProductCategoryValidation = z.object({
  title: z.string().min(1, 'Tiêu đề danh mục không được để trống'),
  parent_id: z.string().nullable().optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional().default('active'),
  position: z.preprocess(val => Number(val), z.number().int().optional().default(0)),
})
export const ProductCategoryInputSchema = ProductCategoryValidation
export type ProductCategoryInputDTO = z.infer<typeof ProductCategoryInputSchema>

// ==========================================
// Product Query DTO
// ==========================================
export const ProductQuerySchema = z.object({
  page: z.preprocess(val => Number(val), z.number().int().min(1).optional().default(1)),
  limit: z.preprocess(val => Number(val), z.number().int().min(1).max(100).optional().default(10)),
  search: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  categoryId: z.string().optional(),
  sortKey: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})
export type ProductQueryDTO = z.infer<typeof ProductQuerySchema>
