import { and, asc, count, desc, eq, gte, inArray, isNull, like } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { kv } from 'hub:kv'

// --- 1. Product & Category Service ---
export const ProductService = {
  // Get products for Admin
  async getProductsAdmin(query: any) {
    const conditions: any[] = [eq(schema.products.deleted, 0)]

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
    const limit = parseInt(query.limit) || 10
    const page = parseInt(query.page) || 1
    const skip = (page - 1) * limit

    // Sorting
    let orderByClause: any[] = [desc(schema.products.position), desc(schema.products.createdAt)]
    if (query.sortKey && query.sortValue) {
      const col = schema.products[query.sortKey as keyof typeof schema.products.$inferSelect]
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
    const products = rows.map(row => ({
      ...row.product,
      product_category_id: row.category || null,
    }))

    return { products, total, page, limit, pages: Math.ceil(total / limit) }
  },

  // Get products for Client
  async getProductsClient(query: any) {
    const conditions: any[] = [eq(schema.products.status, 'active'), eq(schema.products.deleted, 0)]

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
    let orderByClause: any[] = [desc(schema.products.position), desc(schema.products.createdAt)]
    if (query.sort === 'price_asc')
      orderByClause = [asc(schema.products.price)]
    else if (query.sort === 'price_desc')
      orderByClause = [desc(schema.products.price)]
    else if (query.sort === 'title_asc')
      orderByClause = [asc(schema.products.title)]
    else if (query.sort === 'title_desc')
      orderByClause = [desc(schema.products.title)]

    const limit = parseInt(query.limit) || 12
    const page = parseInt(query.page) || 1
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

    const rawProducts = rows.map(row => ({
      ...row.product,
      product_category_id: row.category || null,
    }))

    // Dynamic price calculation
    const productsWithNewPrice = rawProducts.map((product: any) => {
      product.priceNew = Number.parseFloat((product.price * (1 - product.discountPercentage / 100)).toFixed(2))
      return product
    })

    // Min / Max Price Filter (based on actual priceNew)
    let filteredProducts = productsWithNewPrice
    if (query.price_min !== undefined && query.price_min !== '') {
      const min = Number.parseFloat(query.price_min) * 1000000
      if (!Number.isNaN(min)) {
        filteredProducts = filteredProducts.filter(p => p.priceNew >= min)
      }
    }
    if (query.price_max !== undefined && query.price_max !== '') {
      const max = Number.parseFloat(query.price_max) * 1000000
      if (!Number.isNaN(max)) {
        filteredProducts = filteredProducts.filter(p => p.priceNew <= max)
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
  async getCategoriesTree(filter: any = {}) {
    const conditions: any[] = [eq(schema.productCategories.deleted, 0)]
    if (filter.status === 'active') {
      conditions.push(eq(schema.productCategories.status, 'active'))
    }

    const categories = await db.select()
      .from(schema.productCategories)
      .where(and(...conditions))
      .orderBy(asc(schema.productCategories.position))

    const buildTree = (parentId: any): any[] => {
      return categories
        .filter((c: any) => String(c.parent_id || '') === String(parentId || ''))
        .map((c: any) => ({
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

  // Cascading Restore Category
  async restoreCategory(id: string): Promise<any> {
    const cats = await db.select()
      .from(schema.productCategories)
      .where(and(eq(schema.productCategories.id, id), eq(schema.productCategories.deleted, 1)))
      .limit(1)
    const category = cats[0]
    if (!category)
      return

    // Restore parent categories recursively
    if (category.parent_id) {
      const parents = await db.select()
        .from(schema.productCategories)
        .where(and(eq(schema.productCategories.id, category.parent_id), eq(schema.productCategories.deleted, 1)))
        .limit(1)
      const parent = parents[0]
      if (parent) {
        await this.restoreCategory(parent.id)
      }
    }

    return db.update(schema.productCategories)
      .set({ deleted: 0, deletedAt: null, deletedBy: null })
      .where(eq(schema.productCategories.id, id))
  },

  // Automatically update and arrange positions of categories
  async updateCategoryPositions(parentId: any) {
    const conditions: any[] = [eq(schema.productCategories.deleted, 0)]
    if (parentId === null) {
      conditions.push(isNull(schema.productCategories.parent_id))
    }
    else {
      conditions.push(eq(schema.productCategories.parent_id, parentId))
    }

    const categories = await db.select()
      .from(schema.productCategories)
      .where(and(...conditions))
      .orderBy(asc(schema.productCategories.position))

    for (let i = 0; i < categories.length; i++) {
      await db.update(schema.productCategories)
        .set({ position: i + 1 })
        .where(eq(schema.productCategories.id, categories[i].id))
    }
  },

  async invalidateProductsCache() {
    const keys = await kv.keys('cache:products:list:')
    for (const key of keys) {
      await kv.del(key)
    }
  },
}

// --- 2. Cart Service ---
export const CartService = {
  async getOrCreateCart(cartId: string | undefined, userId: string | null = null) {
    let cart: any = null

    if (userId) {
      const carts = await db.select()
        .from(schema.carts)
        .where(eq(schema.carts.user_id, userId))
        .limit(1)
      cart = carts[0]

      if (cart && typeof cart.products === 'string') {
        try {
          cart.products = JSON.parse(cart.products)
        }
        catch {
          cart.products = []
        }
      }
      else if (cart && !cart.products) {
        cart.products = []
      }

      if (!cart) {
        const newCartId = crypto.randomUUID()
        await db.insert(schema.carts).values({
          id: newCartId,
          user_id: userId,
          products: [] as any,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        const carts = await db.select().from(schema.carts).where(eq(schema.carts.id, newCartId)).limit(1)
        cart = carts[0]
        cart.products = []
      }
    }
    else {
      // Guest user (not logged in) - load from Cloudflare KV
      if (cartId) {
        cart = await kv.get(`cart:guest:${cartId}`)
      }
      if (!cart) {
        const newCartId = crypto.randomUUID()
        cart = {
          id: newCartId,
          user_id: null,
          products: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        // Save to KV with TTL 7 days (604800 seconds)
        await kv.set(`cart:guest:${newCartId}`, cart, { ttl: 604800 })
      }
    }

    return cart
  },

  async addToCart(cartId: string, productId: string, quantity: number, userId: string | null = null) {
    const cart = await this.getOrCreateCart(cartId, userId)

    // Check stock
    const prods = await db.select()
      .from(schema.products)
      .where(eq(schema.products.id, productId))
      .limit(1)
    const product = prods[0]
    if (!product || product.status !== 'active' || product.deleted === 1)
      throw new Error('Sản phẩm không khả dụng')

    const itemIndex = cart.products.findIndex((p: any) => String(p.product_id) === productId)
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
      await kv.set(`cart:guest:${cart.id}`, cart, { ttl: 604800 })
    }
    else {
      // Update in SQLite
      await db.update(schema.carts)
        .set({
          products: JSON.stringify(cart.products) as any,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.carts.id, cart.id))
    }

    return cart
  },

  async updateCartItem(cartId: string, productId: string, quantity: number, userId: string | null = null) {
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

    const itemIndex = cart.products.findIndex((p: any) => String(p.product_id) === productId)
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
        await kv.set(`cart:guest:${cart.id}`, cart, { ttl: 604800 })
      }
      else {
        // Update in SQLite
        await db.update(schema.carts)
          .set({
            products: JSON.stringify(cart.products) as any,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(schema.carts.id, cart.id))
      }
    }
    return cart
  },

  async deleteCartItem(cartId: string, productId: string, userId: string | null = null) {
    const cart = await this.getOrCreateCart(cartId, userId)
    cart.products = cart.products.filter((p: any) => String(p.product_id) !== productId)

    if (!userId) {
      // Update in KV
      cart.updatedAt = new Date().toISOString()
      await kv.set(`cart:guest:${cart.id}`, cart, { ttl: 604800 })
    }
    else {
      // Update in SQLite
      await db.update(schema.carts)
        .set({
          products: JSON.stringify(cart.products) as any,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.carts.id, cart.id))
    }
    return cart
  },

  // Cart Merging Algorithm
  async mergeCarts(guestCartId: string, userId: string) {
    const guestCartKey = `cart:guest:${guestCartId}`
    const guestCart = await kv.get<any>(guestCartKey)
    if (!guestCart)
      return

    let guestProducts: any[] = guestCart.products || []
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
        (uItem: any) => String(uItem.product_id) === String(guestItem.product_id),
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
        products: JSON.stringify(userCart.products) as any,
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
  async processCheckout(cartId: string, userInfo: any, userId: string | null = null) {
    return await db.transaction(async (tx) => {
      const carts = await tx.select()
        .from(schema.carts)
        .where(eq(schema.carts.id, cartId))
        .limit(1)
      const cart = carts[0]
      if (!cart) {
        throw new Error('Giỏ hàng của bạn không tồn tại')
      }

      let cartProducts: any[] = []
      if (typeof cart.products === 'string') {
        cartProducts = JSON.parse(cart.products)
      }
      else if (Array.isArray(cart.products)) {
        cartProducts = cart.products
      }

      if (cartProducts.length === 0) {
        throw new Error('Giỏ hàng của bạn đang trống')
      }

      const orderProducts: any[] = []

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
          price: product.price,
          discountPercentage: product.discountPercentage,
          quantity: item.quantity,
        })
      }

      const orderId = crypto.randomUUID()
      await tx.insert(schema.orders).values({
        id: orderId,
        user_id: userId,
        cart_id: cartId,
        userInfo: JSON.stringify(userInfo) as any,
        products: JSON.stringify(orderProducts) as any,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      // Clear cart
      await tx.update(schema.carts)
        .set({
          products: '[]',
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.carts.id, cartId))

      // Return order
      const orders = await tx.select()
        .from(schema.orders)
        .where(eq(schema.orders.id, orderId))
        .limit(1)

      const order = orders[0]
      if (order && typeof order.userInfo === 'string') {
        order.userInfo = JSON.parse(order.userInfo)
      }
      if (order && typeof order.products === 'string') {
        order.products = JSON.parse(order.products)
      }

      return order
    })
  },
}
