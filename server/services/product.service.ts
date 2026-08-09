import type { SQL } from 'drizzle-orm'
import { and, asc, count, desc, eq, inArray, isNull, like } from 'drizzle-orm'
import { db, schema } from 'hub:db'

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

export const ProductService = {
  // Get products for Admin
  async getProductsAdmin(query: AdminProductQuery = {}) {
    const conditions: SQL[] = [eq(schema.products.deleted, 0)]

    if (query.status === 'active' || query.status === 'inactive') {
      conditions.push(eq(schema.products.status, query.status))
    }

    if (query.q) {
      conditions.push(like(schema.products.title, `%${query.q}%`))
    }

    if (query.category_id) {
      conditions.push(eq(schema.products.product_category_id, query.category_id))
    }

    const whereClause = and(...conditions)

    const limit = typeof query.limit === 'number' ? query.limit : Number.parseInt(String(query.limit || 10), 10) || 10
    const page = typeof query.page === 'number' ? query.page : Number.parseInt(String(query.page || 1), 10) || 1
    const skip = (page - 1) * limit

    let orderByClause: SQL[] = [desc(schema.products.position), desc(schema.products.createdAt)]
    if (query.sortKey && query.sortValue) {
      const col = schema.products[query.sortKey as keyof Product]
      if (col) {
        const orderDir = String(query.sortValue).toLowerCase() === 'desc' || query.sortValue === -1 ? desc(col) : asc(col)
        orderByClause = [orderDir]
      }
    }

    const [countRes, rows] = await Promise.all([
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
        .offset(skip),
    ])

    const total = countRes[0]?.value || 0
    const products: ProductWithCategory[] = rows.map(row => ({
      ...row.product,
      product_category_id: row.category || null,
    }))

    return { products, total, page, limit, pages: Math.ceil(total / limit) }
  },

  // Get products for Client
  async getProductsClient(query: ClientProductQuery = {}) {
    const conditions: SQL[] = [eq(schema.products.status, 'active'), eq(schema.products.deleted, 0)]

    if (query.q) {
      conditions.push(like(schema.products.title, `%${query.q}%`))
    }

    if (query.category_slug) {
      const cats = await db.select()
        .from(schema.productCategories)
        .where(and(
          eq(schema.productCategories.slug, query.category_slug),
          eq(schema.productCategories.status, 'active'),
          eq(schema.productCategories.deleted, 0),
        ))
        .limit(1)

      const category = cats[0]
      if (category) {
        const subCategoryIds = await this.getChildCategoryIds(category.id)
        conditions.push(inArray(schema.products.product_category_id, [category.id, ...subCategoryIds]))
      }
      else {
        return { products: [], total: 0, page: 1, limit: 10, pages: 0 }
      }
    }

    const whereClause = and(...conditions)

    let orderByClause: SQL[] = [desc(schema.products.position), desc(schema.products.createdAt)]
    if (query.sort === 'price_asc')
      orderByClause = [asc(schema.products.price)]
    else if (query.sort === 'price_desc')
      orderByClause = [desc(schema.products.price)]
    else if (query.sort === 'title_asc')
      orderByClause = [asc(schema.products.title)]
    else if (query.sort === 'title_desc')
      orderByClause = [desc(schema.products.title)]

    const limit = typeof query.limit === 'number' ? query.limit : Number.parseInt(String(query.limit || 12), 10) || 12
    const page = typeof query.page === 'number' ? query.page : Number.parseInt(String(query.page || 1), 10) || 1
    const skip = (page - 1) * limit

    const rows = await db.select({
      product: schema.products,
      category: schema.productCategories,
    })
      .from(schema.products)
      .leftJoin(schema.productCategories, eq(schema.products.product_category_id, schema.productCategories.id))
      .where(whereClause)
      .orderBy(...orderByClause)

    const rawProducts: ProductWithCategory[] = rows.map(row => ({
      ...row.product,
      product_category_id: row.category || null,
    }))

    const productsWithNewPrice: ProductWithCategory[] = rawProducts.map((product) => {
      const price = product.price || 0
      const discountPercentage = product.discountPercentage || 0
      const priceNew = Number.parseFloat((price * (1 - discountPercentage / 100)).toFixed(2))
      return { ...product, priceNew }
    })

    let filteredProducts = productsWithNewPrice
    if (query.price_min !== undefined && query.price_min !== '') {
      const min = Number.parseFloat(String(query.price_min)) * 1000000
      if (!Number.isNaN(min)) {
        filteredProducts = filteredProducts.filter(p => (p.priceNew || 0) >= min)
      }
    }
    if (query.price_max !== undefined && query.price_max !== '') {
      const max = Number.parseFloat(String(query.price_max)) * 1000000
      if (!Number.isNaN(max)) {
        filteredProducts = filteredProducts.filter(p => (p.priceNew || 0) <= max)
      }
    }

    const total = filteredProducts.length
    const paginatedProducts = filteredProducts.slice(skip, skip + limit)

    return {
      products: paginatedProducts,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    }
  },

  async getProductById(id: string) {
    const rows = await db.select({
      product: schema.products,
      category: schema.productCategories,
    })
      .from(schema.products)
      .leftJoin(schema.productCategories, eq(schema.products.product_category_id, schema.productCategories.id))
      .where(and(
        eq(schema.products.id, id),
        eq(schema.products.status, 'active'),
        eq(schema.products.deleted, 0),
      ))
      .limit(1)

    return rows[0] || null
  },

  async getChildCategoryIds(parentId: string): Promise<string[]> {
    const children = await db.select()
      .from(schema.productCategories)
      .where(and(
        eq(schema.productCategories.parent_id, parentId),
        eq(schema.productCategories.status, 'active'),
        eq(schema.productCategories.deleted, 0),
      ))
    let ids: string[] = children.map(c => c.id)
    for (const child of children) {
      const subIds = await this.getChildCategoryIds(child.id)
      ids = [...ids, ...subIds]
    }
    return ids
  },

  async deleteProduct(id: string, accountId: string) {
    return db.update(schema.products)
      .set({
        deleted: 1,
        deletedAt: new Date().toISOString(),
        deletedBy: accountId,
      })
      .where(eq(schema.products.id, id))
  },

  async restoreProduct(id: string) {
    const prods = await db.select()
      .from(schema.products)
      .where(and(eq(schema.products.id, id), eq(schema.products.deleted, 1)))
      .limit(1)
    const product = prods[0]
    if (!product)
      throw new Error('Sản phẩm không tồn tại trong thùng rác')

    if (product.product_category_id) {
      const cats = await db.select()
        .from(schema.productCategories)
        .where(and(eq(schema.productCategories.id, product.product_category_id), eq(schema.productCategories.deleted, 1)))
        .limit(1)
      const category = cats[0]
      if (category) {
        await this.restoreCategory(category.id)
      }
    }

    return db.update(schema.products)
      .set({ deleted: 0, deletedAt: null, deletedBy: null })
      .where(eq(schema.products.id, id))
  },

  async getCategoriesTree(filter: CategoryFilter = {}): Promise<CategoryNode[]> {
    const conditions: SQL[] = [eq(schema.productCategories.deleted, 0)]
    if (filter.status === 'active') {
      conditions.push(eq(schema.productCategories.status, 'active'))
    }

    const categories = await db.select()
      .from(schema.productCategories)
      .where(and(...conditions))
      .orderBy(asc(schema.productCategories.position))

    const buildTree = (parentId: string | null): CategoryNode[] => {
      return categories
        .filter(c => String(c.parent_id || '') === String(parentId || ''))
        .map(c => ({
          ...c,
          children: buildTree(c.id),
        }))
    }

    return buildTree(null)
  },

  async deleteCategory(id: string, accountId: string) {
    const childCats = await db.select()
      .from(schema.productCategories)
      .where(and(eq(schema.productCategories.parent_id, id), eq(schema.productCategories.deleted, 0)))
      .limit(1)
    if (childCats.length > 0) {
      throw new Error(`Không thể xóa danh mục này vì vẫn còn danh mục con: ${childCats[0].title}`)
    }

    const prods = await db.select()
      .from(schema.products)
      .where(and(eq(schema.products.product_category_id, id), eq(schema.products.deleted, 0)))
      .limit(1)
    if (prods.length > 0) {
      throw new Error(`Không thể xóa danh mục này vì vẫn còn sản phẩm thuộc về nó: ${prods[0].title}`)
    }

    return db.update(schema.productCategories)
      .set({
        deleted: 1,
        deletedAt: new Date().toISOString(),
        deletedBy: accountId,
      })
      .where(eq(schema.productCategories.id, id))
  },

  async restoreCategory(id: string) {
    const cats = await db.select()
      .from(schema.productCategories)
      .where(and(eq(schema.productCategories.id, id), eq(schema.productCategories.deleted, 1)))
      .limit(1)
    const category = cats[0]
    if (!category)
      throw new Error('Danh mục không tồn tại trong thùng rác')

    if (category.parent_id) {
      const parentCats = await db.select()
        .from(schema.productCategories)
        .where(and(eq(schema.productCategories.id, category.parent_id), eq(schema.productCategories.deleted, 1)))
        .limit(1)
      const parentCat = parentCats[0]
      if (parentCat) {
        await this.restoreCategory(parentCat.id)
      }
    }

    return db.update(schema.productCategories)
      .set({ deleted: 0, deletedAt: null, deletedBy: null })
      .where(eq(schema.productCategories.id, id))
  },

  async updateCategoryPositions(parentId: string | null) {
    const conditions: SQL[] = [eq(schema.productCategories.deleted, 0)]
    if (parentId)
      conditions.push(eq(schema.productCategories.parent_id, parentId))
    else
      conditions.push(isNull(schema.productCategories.parent_id))

    const siblings = await db.select()
      .from(schema.productCategories)
      .where(and(...conditions))
      .orderBy(asc(schema.productCategories.position))

    for (let i = 0; i < siblings.length; i++) {
      await db.update(schema.productCategories)
        .set({ position: i + 1 })
        .where(eq(schema.productCategories.id, siblings[i].id))
    }
  },
}
