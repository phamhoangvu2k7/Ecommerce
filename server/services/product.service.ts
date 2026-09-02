import type { SQL } from 'drizzle-orm'
import { and, asc, count, desc, eq, inArray, isNull, like } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { kv } from 'hub:kv'

export type Category = typeof schema.productCategories.$inferSelect
export type CategoryNode = Category & { children: CategoryNode[] }

export type Product = typeof schema.products.$inferSelect
export type ProductWithCategory = Omit<Product, 'product_category_id'> & {
  product_category_id: Category | null
  priceNew?: number
}

export interface CategoryFilter {
  status?: 'active' | 'inactive' | string
}

export interface AdminProductQuery {
  status?: string
  q?: string
  category_id?: string
  limit?: string | number
  page?: string | number
  sortKey?: string
  sortValue?: string | number
}

export interface ClientProductQuery {
  q?: string
  category_slug?: string
  sort?: 'price_asc' | 'price_desc' | 'title_asc' | 'title_desc' | string
  limit?: string | number
  page?: string | number
  price_min?: string | number
  price_max?: string | number
}

/**
 * Hàm hỗ trợ ép kiểu tham số phân trang (page, limit) thành số nguyên hợp lệ.
 */
function parsePaginationNumber(value: string | number | undefined, defaultValue: number): number {
  if (typeof value === 'number') {
    return value > 0 ? value : defaultValue
  }
  if (!value) {
    return defaultValue
  }
  const parsedValue = Number.parseInt(String(value), 10)
  return Number.isNaN(parsedValue) || parsedValue < 1 ? defaultValue : parsedValue
}

export const ProductService = {
  // Lấy danh sách sản phẩm cho trang Quản trị (Admin)
  async getProductsAdmin(query: AdminProductQuery = {}) {
    const conditions: SQL[] = [eq(schema.products.deleted, 0)]

    // Lọc theo trạng thái hoạt động ('active' hoặc 'inactive')
    if (query.status === 'active' || query.status === 'inactive') {
      conditions.push(eq(schema.products.status, query.status))
    }

    // Lọc theo từ khóa tìm kiếm trong tiêu đề sản phẩm
    if (query.q) {
      conditions.push(like(schema.products.title, `%${query.q}%`))
    }

    // Lọc theo danh mục sản phẩm cụ thể
    if (query.category_id) {
      conditions.push(eq(schema.products.product_category_id, query.category_id))
    }

    const whereClause = and(...conditions)

    // Xử lý phân trang
    const limit = parsePaginationNumber(query.limit, 10)
    const page = parsePaginationNumber(query.page, 1)
    const skipRows = (page - 1) * limit

    // Xử lý sắp xếp dữ liệu
    let orderByClause: SQL[] = [desc(schema.products.position), desc(schema.products.createdAt)]
    if (query.sortKey && query.sortValue) {
      const sortColumn = schema.products[query.sortKey as keyof Product]
      if (sortColumn) {
        const isDescending = String(query.sortValue).toLowerCase() === 'desc' || query.sortValue === -1
        const sortDirection = isDescending ? desc(sortColumn) : asc(sortColumn)
        orderByClause = [sortDirection]
      }
    }

    // Lấy tổng số lượng và danh sách dữ liệu đồng thời
    const [countResult, databaseRows] = await Promise.all([
      db.select({ value: count() }).from(schema.products).where(whereClause),
      db.select({
        product: schema.products,
        category: schema.productCategories,
      })
        .from(schema.products)
        .leftJoin(schema.productCategories, eq(schema.products.product_category_id, schema.productCategories.id))
        .where(whereClause)
        .orderBy(...orderByClause)
        .limit(limit)
        .offset(skipRows),
    ])

    const totalProducts = countResult[0]?.value || 0
    const products: ProductWithCategory[] = databaseRows.map(row => ({
      ...row.product,
      product_category_id: row.category || null,
    }))

    return {
      products,
      total: totalProducts,
      page,
      limit,
      pages: Math.ceil(totalProducts / limit),
    }
  },

  // Lấy danh sách sản phẩm cho trang Người dùng (Client)
  async getProductsClient(query: ClientProductQuery = {}) {
    const conditions: SQL[] = [
      eq(schema.products.status, 'active'),
      eq(schema.products.deleted, 0),
    ]

    // Tìm kiếm theo từ khóa
    if (query.q) {
      conditions.push(like(schema.products.title, `%${query.q}%`))
    }

    // Tìm kiếm theo đường dẫn danh mục (slug) bao gồm cả các danh mục con
    if (query.category_slug) {
      const matchedCategories = await db.select()
        .from(schema.productCategories)
        .where(and(
          eq(schema.productCategories.slug, query.category_slug),
          eq(schema.productCategories.status, 'active'),
          eq(schema.productCategories.deleted, 0),
        ))
        .limit(1)

      const targetCategory = matchedCategories[0]
      if (targetCategory) {
        const childCategoryIds = await this.getChildCategoryIds(targetCategory.id)
        const allCategoryIds = [targetCategory.id, ...childCategoryIds]
        conditions.push(inArray(schema.products.product_category_id, allCategoryIds))
      }
      else {
        return { products: [], total: 0, page: 1, limit: 12, pages: 0 }
      }
    }

    const whereClause = and(...conditions)

    // Xử lý sắp xếp theo lựa chọn của người dùng
    let orderByClause: SQL[] = [desc(schema.products.position), desc(schema.products.createdAt)]
    if (query.sort === 'price_asc') {
      orderByClause = [asc(schema.products.price)]
    }
    else if (query.sort === 'price_desc') {
      orderByClause = [desc(schema.products.price)]
    }
    else if (query.sort === 'title_asc') {
      orderByClause = [asc(schema.products.title)]
    }
    else if (query.sort === 'title_desc') {
      orderByClause = [desc(schema.products.title)]
    }

    const limit = parsePaginationNumber(query.limit, 12)
    const page = parsePaginationNumber(query.page, 1)
    const skipRows = (page - 1) * limit

    const databaseRows = await db.select({
      product: schema.products,
      category: schema.productCategories,
    })
      .from(schema.products)
      .leftJoin(schema.productCategories, eq(schema.products.product_category_id, schema.productCategories.id))
      .where(whereClause)
      .orderBy(...orderByClause)

    const rawProducts: ProductWithCategory[] = databaseRows.map(row => ({
      ...row.product,
      product_category_id: row.category || null,
    }))

    // Tính toán giá mới (sau khi áp dụng % giảm giá)
    const productsWithNewPrice: ProductWithCategory[] = rawProducts.map((product) => {
      const originalPrice = product.price || 0
      const discountPercent = product.discountPercentage || 0
      const calculatedNewPrice = Number.parseFloat((originalPrice * (1 - discountPercent / 100)).toFixed(2))
      return { ...product, priceNew: calculatedNewPrice }
    })

    // Lọc theo khoảng giá tối thiểu và tối đa (nếu người dùng chọn)
    let filteredProducts = productsWithNewPrice
    if (query.price_min !== undefined && query.price_min !== '') {
      const minPriceInVnd = Number.parseFloat(String(query.price_min))
      if (!Number.isNaN(minPriceInVnd)) {
        filteredProducts = filteredProducts.filter(product => (product.priceNew ?? product.price ?? 0) >= minPriceInVnd)
      }
    }

    if (query.price_max !== undefined && query.price_max !== '') {
      const maxPriceInVnd = Number.parseFloat(String(query.price_max))
      if (!Number.isNaN(maxPriceInVnd)) {
        filteredProducts = filteredProducts.filter(product => (product.priceNew ?? product.price ?? 0) <= maxPriceInVnd)
      }
    }

    const totalProducts = filteredProducts.length
    const paginatedProducts = filteredProducts.slice(skipRows, skipRows + limit)

    return {
      products: paginatedProducts,
      total: totalProducts,
      page,
      limit,
      pages: Math.ceil(totalProducts / limit),
    }
  },

  // Lấy chi tiết 1 sản phẩm theo ID
  async getProductById(productId: string) {
    const databaseRows = await db.select({
      product: schema.products,
      category: schema.productCategories,
    })
      .from(schema.products)
      .leftJoin(schema.productCategories, eq(schema.products.product_category_id, schema.productCategories.id))
      .where(and(
        eq(schema.products.id, productId),
        eq(schema.products.status, 'active'),
        eq(schema.products.deleted, 0),
      ))
      .limit(1)

    return databaseRows[0] || null
  },

  // Đệ quy lấy tất cả ID của danh mục con trực thuộc danh mục cha
  async getChildCategoryIds(parentCategoryId: string): Promise<string[]> {
    const childCategories = await db.select()
      .from(schema.productCategories)
      .where(and(
        eq(schema.productCategories.parent_id, parentCategoryId),
        eq(schema.productCategories.status, 'active'),
        eq(schema.productCategories.deleted, 0),
      ))

    let accumulatedIds: string[] = childCategories.map(category => category.id)
    for (const childCategory of childCategories) {
      const subCategoryIds = await this.getChildCategoryIds(childCategory.id)
      accumulatedIds = [...accumulatedIds, ...subCategoryIds]
    }
    return accumulatedIds
  },

  // Xóa sản phẩm vào thùng rác (Soft Delete)
  async deleteProduct(productId: string, accountId: string) {
    return db.update(schema.products)
      .set({
        deleted: 1,
        deletedAt: new Date().toISOString(),
        deletedBy: accountId,
      })
      .where(eq(schema.products.id, productId))
  },

  // Khôi phục sản phẩm từ thùng rác
  async restoreProduct(productId: string) {
    const matchedProducts = await db.select()
      .from(schema.products)
      .where(and(eq(schema.products.id, productId), eq(schema.products.deleted, 1)))
      .limit(1)

    const targetProduct = matchedProducts[0]
    if (!targetProduct) {
      throw new Error('Sản phẩm không tồn tại trong thùng rác')
    }

    if (targetProduct.product_category_id) {
      const matchedCategories = await db.select()
        .from(schema.productCategories)
        .where(and(eq(schema.productCategories.id, targetProduct.product_category_id), eq(schema.productCategories.deleted, 1)))
        .limit(1)

      const targetCategory = matchedCategories[0]
      if (targetCategory) {
        await this.restoreCategory(targetCategory.id)
      }
    }

    return db.update(schema.products)
      .set({ deleted: 0, deletedAt: null, deletedBy: null })
      .where(eq(schema.products.id, productId))
  },

  // Lấy toàn bộ cây danh mục (Category Tree)
  async getCategoriesTree(filter: CategoryFilter = {}): Promise<CategoryNode[]> {
    const conditions: SQL[] = [eq(schema.productCategories.deleted, 0)]
    if (filter.status === 'active') {
      conditions.push(eq(schema.productCategories.status, 'active'))
    }

    const allCategories = await db.select()
      .from(schema.productCategories)
      .where(and(...conditions))
      .orderBy(asc(schema.productCategories.position))

    const buildTreeRecursive = (parentId: string | null): CategoryNode[] => {
      const currentLevelCategories = allCategories.filter((category) => {
        const currentParentId = String(category.parent_id || '')
        const targetParentId = String(parentId || '')
        return currentParentId === targetParentId
      })

      return currentLevelCategories.map(category => ({
        ...category,
        children: buildTreeRecursive(category.id),
      }))
    }

    return buildTreeRecursive(null)
  },

  // Xóa danh mục (Kiểm tra ràng buộc xem còn danh mục con hay sản phẩm không)
  async deleteCategory(categoryId: string, accountId: string) {
    const childCategories = await db.select()
      .from(schema.productCategories)
      .where(and(eq(schema.productCategories.parent_id, categoryId), eq(schema.productCategories.deleted, 0)))
      .limit(1)

    if (childCategories.length > 0) {
      throw new Error(`Không thể xóa danh mục này vì vẫn còn danh mục con: ${childCategories[0].title}`)
    }

    const belongingProducts = await db.select()
      .from(schema.products)
      .where(and(eq(schema.products.product_category_id, categoryId), eq(schema.products.deleted, 0)))
      .limit(1)

    if (belongingProducts.length > 0) {
      throw new Error(`Không thể xóa danh mục này vì vẫn còn sản phẩm thuộc về nó: ${belongingProducts[0].title}`)
    }

    return db.update(schema.productCategories)
      .set({
        deleted: 1,
        deletedAt: new Date().toISOString(),
        deletedBy: accountId,
      })
      .where(eq(schema.productCategories.id, categoryId))
  },

  // Khôi phục danh mục từ thùng rác (Đồng thời khôi phục cả danh mục cha nếu có)
  async restoreCategory(categoryId: string) {
    const matchedCategories = await db.select()
      .from(schema.productCategories)
      .where(and(eq(schema.productCategories.id, categoryId), eq(schema.productCategories.deleted, 1)))
      .limit(1)

    const targetCategory = matchedCategories[0]
    if (!targetCategory) {
      throw new Error('Danh mục không tồn tại trong thùng rác')
    }

    if (targetCategory.parent_id) {
      const parentCategories = await db.select()
        .from(schema.productCategories)
        .where(and(eq(schema.productCategories.id, targetCategory.parent_id), eq(schema.productCategories.deleted, 1)))
        .limit(1)

      const parentCategory = parentCategories[0]
      if (parentCategory) {
        await this.restoreCategory(parentCategory.id)
      }
    }

    return db.update(schema.productCategories)
      .set({ deleted: 0, deletedAt: null, deletedBy: null })
      .where(eq(schema.productCategories.id, categoryId))
  },

  // Cập nhật vị trí thứ tự sắp xếp của các danh mục cùng cấp
  async updateCategoryPositions(parentCategoryId: string | null) {
    const conditions: SQL[] = [eq(schema.productCategories.deleted, 0)]
    if (parentCategoryId) {
      conditions.push(eq(schema.productCategories.parent_id, parentCategoryId))
    }
    else {
      conditions.push(isNull(schema.productCategories.parent_id))
    }

    const siblingCategories = await db.select()
      .from(schema.productCategories)
      .where(and(...conditions))
      .orderBy(asc(schema.productCategories.position))

    for (let index = 0; index < siblingCategories.length; index++) {
      const currentCategory = siblingCategories[index]
      const newPosition = index + 1
      await db.update(schema.productCategories)
        .set({ position: newPosition })
        .where(eq(schema.productCategories.id, currentCategory.id))
    }
  },

  // Xóa bộ nhớ đệm (cache) sản phẩm trong KV
  async invalidateProductsCache() {
    try {
      const keys = await kv.keys('cache:products')
      for (const key of keys) {
        await kv.del(key)
      }
    }
    catch (err) {
      console.error('Error invalidating products cache:', err)
    }
  },
}

