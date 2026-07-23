import type { SQL } from 'drizzle-orm'
import { and, asc, count, desc, eq, gte, inArray, isNull, like } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { kv } from 'hub:kv'

// --- Types & Interfaces ---
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

export interface CartItem {
  product_id: string
  quantity: number
}

export interface CartData {
  id: string
  user_id: string | null
  products: CartItem[]
  createdAt: string
  updatedAt: string
}

export interface UserInfo {
  fullName?: string
  email?: string
  phone?: string
  address?: string
  [key: string]: unknown
}

export interface OrderProductItem {
  product_id: string
  price: number
  discountPercentage: number | null
  quantity: number
}

// --- 1. Product & Category Service ---
export const ProductService = {
  // Get products for Admin
  async getProductsAdmin(query: AdminProductQuery = {}) {
    const conditions: SQL[] = [eq(schema.products.deleted, 0)]

    // Status filter
    if (query.status === 'active' || query.status === 'inactive') {
      conditions.push(eq(schema.products.status, query.status))
    }

    // Search query
    if (query.q) {
      conditions.push(like(schema.products.title, `%${query.q}%`))
    }

    // Category filter
    if (query.category_id) {
      conditions.push(eq(schema.products.product_category_id, query.category_id))
    }

    const whereClause = and(...conditions)

    // Pagination
    const limit = typeof query.limit === 'number' ? query.limit : Number.parseInt(String(query.limit || 10), 10) || 10
    const page = typeof query.page === 'number' ? query.page : Number.parseInt(String(query.page || 1), 10) || 1
    const skip = (page - 1) * limit

    // Sorting
    let orderByClause: SQL[] = [desc(schema.products.position), desc(schema.products.createdAt)]
    if (query.sortKey && query.sortValue) {
      const col = schema.products[query.sortKey as keyof Product]
      if (col) {
        const orderDir = String(query.sortValue).toLowerCase() === 'desc' || query.sortValue === -1 ? desc(col) : asc(col)
        orderByClause = [orderDir]
      }
    }

    // Fetch total and paginated products
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

    // Search query
    if (query.q) {
      conditions.push(like(schema.products.title, `%${query.q}%`))
    }

    // Category filter (includes subcategories)
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
        // Find all child category IDs recursively
        const subCategoryIds = await this.getChildCategoryIds(category.id)
        conditions.push(inArray(schema.products.product_category_id, [category.id, ...subCategoryIds]))
      }
      else {
        // If category slug is not found, return empty
        return { products: [], total: 0, page: 1, limit: 10, pages: 0 }
      }
    }

    const whereClause = and(...conditions)

    // Sorting
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

    // Query all matching products with categories
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

    // Dynamic price calculation
    const productsWithNewPrice: ProductWithCategory[] = rawProducts.map((product) => {
      const price = product.price || 0
      const discountPercentage = product.discountPercentage || 0
      const priceNew = Number.parseFloat((price * (1 - discountPercentage / 100)).toFixed(2))
      return { ...product, priceNew }
    })

    // Min / Max Price Filter (based on actual priceNew)
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

  // Soft delete product
  async deleteProduct(id: string, accountId: string) {
    return db.update(schema.products)
      .set({
        deleted: 1,
        deletedAt: new Date().toISOString(),
        deletedBy: accountId,
      })
      .where(eq(schema.products.id, id))
  },

  // Restore product with Cascading Restore
  async restoreProduct(id: string) {
    const prods = await db.select()
      .from(schema.products)
      .where(and(eq(schema.products.id, id), eq(schema.products.deleted, 1)))
      .limit(1)
    const product = prods[0]
    if (!product)
      throw new Error('Sản phẩm không tồn tại trong thùng rác')

    // Check parent category
    if (product.product_category_id) {
      const cats = await db.select()
        .from(schema.productCategories)
        .where(and(eq(schema.productCategories.id, product.product_category_id), eq(schema.productCategories.deleted, 1)))
        .limit(1)
      const category = cats[0]
      if (category) {
        // Automatically restore the category first
        await this.restoreCategory(category.id)
      }
    }

    return db.update(schema.products)
      .set({ deleted: 0, deletedAt: null, deletedBy: null })
      .where(eq(schema.products.id, id))
  },

  // Categories Tree construction
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

  // Soft delete category with Cascade Check
  async deleteCategory(id: string, accountId: string) {
    // 1. Check if there are active child categories
    const childCats = await db.select()
      .from(schema.productCategories)
      .where(and(eq(schema.productCategories.parent_id, id), eq(schema.productCategories.deleted, 0)))
      .limit(1)
    if (childCats.length > 0) {
      throw new Error(`Không thể xóa danh mục này vì vẫn còn danh mục con: ${childCats[0].title}`)
    }

    // 2. Check if there are active products inside this category
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

  // Restore category
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

  // Update positions of categories in tree
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

// --- 2. Cart Service ---
export const CartService = {
  async getOrCreateCart(cartId?: string, userId: string | null = null): Promise<CartData> {
    let cart: CartData | null = null

    if (userId) {
      // Logged-in user - load from SQLite
      const carts = await db.select()
        .from(schema.carts)
        .where(eq(schema.carts.user_id, userId))
        .limit(1)

      if (carts[0]) {
        let products: CartItem[] = []
        if (typeof carts[0].products === 'string') {
          try {
            products = JSON.parse(carts[0].products)
          }
          catch {
            products = []
          }
        }
        else if (Array.isArray(carts[0].products)) {
          products = carts[0].products as CartItem[]
        }

        cart = {
          id: carts[0].id,
          user_id: carts[0].user_id,
          products,
          createdAt: carts[0].createdAt || new Date().toISOString(),
          updatedAt: carts[0].updatedAt || new Date().toISOString(),
        }
      }
      else {
        const newCartId = crypto.randomUUID()
        const now = new Date().toISOString()
        await db.insert(schema.carts).values({
          id: newCartId,
          user_id: userId,
          products: [],
          createdAt: now,
          updatedAt: now,
        })
        cart = {
          id: newCartId,
          user_id: userId,
          products: [],
          createdAt: now,
          updatedAt: now,
        }
      }
    }
    else {
      // Guest user (not logged in) - load from Cloudflare KV
      if (cartId) {
        cart = await kv.get<CartData>(`cart:guest:${cartId}`)
      }
      if (!cart) {
        const newCartId = crypto.randomUUID()
        const now = new Date().toISOString()
        cart = {
          id: newCartId,
          user_id: null,
          products: [],
          createdAt: now,
          updatedAt: now,
        }
        // Save to KV with TTL 1 day (86400 seconds)
        await kv.set(`cart:guest:${newCartId}`, cart, { ttl: 86400 })
      }
    }

    return cart
  },

  async addToCart(cartId: string, productId: string, quantity: number, userId: string | null = null): Promise<CartData> {
    const cart = await this.getOrCreateCart(cartId, userId)

    // Check stock
    const prods = await db.select()
      .from(schema.products)
      .where(eq(schema.products.id, productId))
      .limit(1)
    const product = prods[0]
    if (!product || product.status !== 'active' || product.deleted === 1)
      throw new Error('Sản phẩm không khả dụng')

    const itemIndex = cart.products.findIndex(p => String(p.product_id) === productId)
    if (itemIndex > -1) {
      const newQty = cart.products[itemIndex].quantity + quantity
      if (newQty > (product.stock || 0)) {
        throw new Error(`Sản phẩm ${product.title} không đủ số lượng trong kho. Còn lại: ${product.stock}`)
      }
      cart.products[itemIndex].quantity = newQty
    }
    else {
      if (quantity > (product.stock || 0)) {
        throw new Error(`Sản phẩm ${product.title} không đủ số lượng trong kho. Còn lại: ${product.stock}`)
      }
      cart.products.push({ product_id: productId, quantity })
    }

    if (!userId) {
      // Update in KV
      cart.updatedAt = new Date().toISOString()
      await kv.set(`cart:guest:${cart.id}`, cart, { ttl: 86400 })
    }
    else {
      // Update in SQLite
      await db.update(schema.carts)
        .set({
          products: JSON.stringify(cart.products) as unknown as typeof schema.carts.$inferInsert['products'],
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.carts.id, cart.id))
    }

    return cart
  },

  async updateCartItem(cartId: string, productId: string, quantity: number, userId: string | null = null): Promise<CartData> {
    const cart = await this.getOrCreateCart(cartId, userId)
    const prods = await db.select()
      .from(schema.products)
      .where(eq(schema.products.id, productId))
      .limit(1)
    const product = prods[0]
    if (!product)
      throw new Error('Sản phẩm không tồn tại')

    if (quantity > (product.stock || 0)) {
      throw new Error(`Sản phẩm ${product.title} không đủ số lượng trong kho. Còn lại: ${product.stock}`)
    }

    const itemIndex = cart.products.findIndex(p => String(p.product_id) === productId)
    if (itemIndex > -1) {
      if (quantity <= 0) {
        cart.products.splice(itemIndex, 1)
      }
      else {
        cart.products[itemIndex].quantity = quantity
      }

      if (!userId) {
        // Update in KV
        cart.updatedAt = new Date().toISOString()
        await kv.set(`cart:guest:${cart.id}`, cart, { ttl: 86400 })
      }
      else {
        // Update in SQLite
        await db.update(schema.carts)
          .set({
            products: JSON.stringify(cart.products) as unknown as typeof schema.carts.$inferInsert['products'],
            updatedAt: new Date().toISOString(),
          })
          .where(eq(schema.carts.id, cart.id))
      }
    }
    return cart
  },

  async deleteCartItem(cartId: string, productId: string, userId: string | null = null): Promise<CartData> {
    const cart = await this.getOrCreateCart(cartId, userId)
    cart.products = cart.products.filter(p => String(p.product_id) !== productId)

    if (!userId) {
      // Update in KV
      cart.updatedAt = new Date().toISOString()
      await kv.set(`cart:guest:${cart.id}`, cart, { ttl: 86400 })
    }
    else {
      // Update in SQLite
      await db.update(schema.carts)
        .set({
          products: JSON.stringify(cart.products) as unknown as typeof schema.carts.$inferInsert['products'],
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.carts.id, cart.id))
    }
    return cart
  },

  // Cart Merging Algorithm
  async mergeCarts(guestCartId: string, userId: string): Promise<void> {
    const guestCartKey = `cart:guest:${guestCartId}`
    const guestCart = await kv.get<CartData>(guestCartKey)
    if (!guestCart)
      return

    let guestProducts: CartItem[] = guestCart.products || []
    if (typeof guestProducts === 'string') {
      try {
        guestProducts = JSON.parse(guestProducts)
      }
      catch {
        guestProducts = []
      }
    }

    if (guestProducts.length === 0)
      return

    const userCart = await this.getOrCreateCart(undefined, userId)

    for (const guestItem of guestProducts) {
      const prods = await db.select()
        .from(schema.products)
        .where(eq(schema.products.id, guestItem.product_id))
        .limit(1)
      const product = prods[0]
      if (!product || product.status !== 'active' || product.deleted === 1)
        continue

      const userItemIndex = userCart.products.findIndex(
        uItem => String(uItem.product_id) === String(guestItem.product_id),
      )

      if (userItemIndex > -1) {
        // Merge quantities and cap to stock
        let mergedQty = userCart.products[userItemIndex].quantity + guestItem.quantity
        if (mergedQty > (product.stock || 0)) {
          mergedQty = product.stock || 0
        }
        userCart.products[userItemIndex].quantity = mergedQty
      }
      else {
        // Add new item capped to stock
        let qty = guestItem.quantity
        if (qty > (product.stock || 0)) {
          qty = product.stock || 0
        }
        userCart.products.push({ product_id: guestItem.product_id, quantity: qty })
      }
    }

    await db.update(schema.carts)
      .set({
        products: JSON.stringify(userCart.products) as unknown as typeof schema.carts.$inferInsert['products'],
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.carts.id, userCart.id))

    // Clear guest cart in KV
    await kv.del(guestCartKey)
  },
}

// --- 3. Checkout Service ---
export const CheckoutService = {
  // Safe Checkout flow - Inventory check & atomic updates with transactions
  async processCheckout(cartId: string, userInfo: UserInfo, userId: string | null = null) {
    return await db.transaction(async (tx) => {
      const carts = await tx.select()
        .from(schema.carts)
        .where(eq(schema.carts.id, cartId))
        .limit(1)
      const cart = carts[0]
      if (!cart) {
        throw new Error('Giỏ hàng của bạn không tồn tại')
      }

      let cartProducts: CartItem[] = []
      if (typeof cart.products === 'string') {
        try {
          cartProducts = JSON.parse(cart.products)
        }
        catch {
          cartProducts = []
        }
      }
      else if (Array.isArray(cart.products)) {
        cartProducts = cart.products as CartItem[]
      }

      if (cartProducts.length === 0) {
        throw new Error('Giỏ hàng của bạn đang trống')
      }

      const orderProducts: OrderProductItem[] = []

      for (const item of cartProducts) {
        const prods = await tx.select()
          .from(schema.products)
          .where(eq(schema.products.id, item.product_id))
          .limit(1)
        const product = prods[0]
        if (!product || product.status !== 'active' || product.deleted === 1) {
          throw new Error('Sản phẩm đã ngừng bán')
        }

        if ((product.stock || 0) < item.quantity) {
          throw new Error(`Sản phẩm ${product.title} hiện không đủ tồn kho. Yêu cầu: ${item.quantity}, Có sẵn: ${product.stock || 0}`)
        }

        // Update product stock
        await tx.update(schema.products)
          .set({
            stock: (product.stock || 0) - item.quantity,
            updatedAt: new Date().toISOString(),
          })
          .where(and(eq(schema.products.id, product.id), gte(schema.products.stock, item.quantity)))

        orderProducts.push({
          product_id: product.id,
          price: product.price || 0,
          discountPercentage: product.discountPercentage,
          quantity: item.quantity,
        })
      }

      const orderId = crypto.randomUUID()
      await tx.insert(schema.orders).values({
        id: orderId,
        user_id: userId,
        cart_id: cartId,
        userInfo: JSON.stringify(userInfo) as unknown as typeof schema.orders.$inferInsert['userInfo'],
        products: JSON.stringify(orderProducts) as unknown as typeof schema.orders.$inferInsert['products'],
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      // Clear cart
      await tx.update(schema.carts)
        .set({
          products: [],
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.carts.id, cartId))

      // Return order
      const orders = await tx.select()
        .from(schema.orders)
        .where(eq(schema.orders.id, orderId))
        .limit(1)

      const order = orders[0]
      let parsedUserInfo: UserInfo = userInfo
      let parsedOrderProducts: OrderProductItem[] = orderProducts

      if (order && typeof order.userInfo === 'string') {
        try {
          parsedUserInfo = JSON.parse(order.userInfo)
        }
        catch {}
      }
      if (order && typeof order.products === 'string') {
        try {
          parsedOrderProducts = JSON.parse(order.products)
        }
        catch {}
      }

      return {
        ...order,
        userInfo: parsedUserInfo,
        products: parsedOrderProducts,
      }
    })
  },
}
