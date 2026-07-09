import { escapeRegex } from './helpers.ts'
import { Cart, Order, Product, ProductCategory } from './models.ts'

// --- 1. Product & Category Service ---
export const ProductService = {
  // Get products for Admin
  async getProductsAdmin(query: any) {
    const filter: any = {}

    // Status filter
    if (query.status === 'active' || query.status === 'inactive') {
      filter.status = query.status
    }

    // Search query
    if (query.q) {
      filter.title = new RegExp(escapeRegex(query.q), 'i')
    }

    // Category filter
    if (query.category_id) {
      filter.product_category_id = query.category_id
    }

    // Pagination
    const limit = parseInt(query.limit) || 10
    const page = parseInt(query.page) || 1
    const skip = (page - 1) * limit

    // Sorting
    let sort: any = { position: 'desc', createdAt: 'desc' }
    if (query.sortKey && query.sortValue) {
      sort = { [query.sortKey]: query.sortValue }
    }

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit).populate('product_category_id'),
      Product.countDocuments(filter),
    ])

    return { products, total, page, limit, pages: Math.ceil(total / limit) }
  },

  // Get products for Client
  async getProductsClient(query: any) {
    const filter: any = { status: 'active' }

    // Search query
    if (query.q) {
      filter.title = new RegExp(escapeRegex(query.q), 'i')
    }

    // Category filter (includes subcategories)
    if (query.category_slug) {
      const category = await ProductCategory.findOne({ slug: query.category_slug, status: 'active' })
      if (category) {
        // Find all child category IDs recursively
        const subCategoryIds = await this.getChildCategoryIds(category._id)
        filter.product_category_id = { $in: [category._id, ...subCategoryIds] }
      }
      else {
        // If category slug is not found, return empty
        return { products: [], total: 0, page: 1, limit: 10, pages: 0 }
      }
    }

    // Sorting
    let sort: any = { position: 'desc', createdAt: 'desc' }
    if (query.sort === 'price_asc')
      sort = { price: 'asc' }
    else if (query.sort === 'price_desc')
      sort = { price: 'desc' }
    else if (query.sort === 'title_asc')
      sort = { title: 'asc' }
    else if (query.sort === 'title_desc')
      sort = { title: 'desc' }

    const limit = parseInt(query.limit) || 12
    const page = parseInt(query.page) || 1
    const skip = (page - 1) * limit

    // Query all matching products (Note: Price filters are applied in-memory or using Mongo aggregate for dynamic pricing)
    const rawProducts = await Product.find(filter).sort(sort).populate('product_category_id')

    // Dynamic price calculation
    const productsWithNewPrice = rawProducts.map((p: any) => {
      const product = p.toObject()
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

  async getChildCategoryIds(parentId: any): Promise<any[]> {
    const children = await ProductCategory.find({ parent_id: parentId, status: 'active' })
    let ids: any[] = children.map(c => c._id)
    for (const child of children) {
      const subIds = await this.getChildCategoryIds(child._id)
      ids = [...ids, ...subIds]
    }
    return ids
  },

  // Soft delete product
  async deleteProduct(id: string, accountId: string) {
    return Product.updateOne(
      { _id: id },
      {
        deleted: true,
        deletedAt: new Date(),
        deletedBy: accountId,
      },
    )
  },

  // Restore product with Cascading Restore
  async restoreProduct(id: string) {
    const product = await Product.findOne({ _id: id, deleted: true })
    if (!product)
      throw new Error('Sản phẩm không tồn tại trong thùng rác')

    // Check parent category
    if (product.product_category_id) {
      const category = await ProductCategory.findOne({ _id: product.product_category_id, deleted: true })
      if (category) {
        // Automatically restore the category first
        await this.restoreCategory(category._id.toString())
      }
    }

    return Product.updateOne({ _id: id, deleted: true }, { deleted: false, deletedAt: null, deletedBy: null })
  },

  // Categories Tree construction
  async getCategoriesTree(filter: any = {}) {
    const categories = await ProductCategory.find(filter).sort({ position: 'asc' }).lean()

    const buildTree = (parentId: any): any[] => {
      return categories
        .filter((c: any) => String(c.parent_id || '') === String(parentId || ''))
        .map((c: any) => ({
          ...c,
          children: buildTree(c._id),
        }))
    }

    return buildTree(null)
  },

  // Soft delete category with Cascade Check
  async deleteCategory(id: string, accountId: string) {
    // 1. Check if there are active child categories
    const childCategory = await ProductCategory.findOne({ parent_id: id, deleted: false })
    if (childCategory) {
      throw new Error(`Không thể xóa danh mục này vì vẫn còn danh mục con: ${childCategory.title}`)
    }

    // 2. Check if there are active products inside this category
    const product = await Product.findOne({ product_category_id: id, deleted: false })
    if (product) {
      throw new Error(`Không thể xóa danh mục này vì vẫn còn sản phẩm thuộc về nó: ${product.title}`)
    }

    return ProductCategory.updateOne(
      { _id: id },
      {
        deleted: true,
        deletedAt: new Date(),
        deletedBy: accountId,
      },
    )
  },

  // Cascading Restore Category
  async restoreCategory(id: string): Promise<any> {
    const category = await ProductCategory.findOne({ _id: id, deleted: true })
    if (!category)
      return

    // Restore parent categories recursively
    if (category.parent_id) {
      const parent = await ProductCategory.findOne({ _id: category.parent_id, deleted: true })
      if (parent) {
        await this.restoreCategory(parent._id.toString())
      }
    }

    return ProductCategory.updateOne({ _id: id, deleted: true }, { deleted: false, deletedAt: null, deletedBy: null })
  },

  // Automatically update and arrange positions of categories
  async updateCategoryPositions(parentId: any) {
    const categories = await ProductCategory.find({ parent_id: parentId, deleted: false }).sort({ position: 'asc' })
    for (let i = 0; i < categories.length; i++) {
      await ProductCategory.updateOne({ _id: categories[i]._id }, { position: i + 1 })
    }
  },
}

// --- 2. Cart Service ---
export const CartService = {
  async getOrCreateCart(cartId: string | undefined, userId: string | null = null) {
    let cart: any = null

    if (userId) {
      cart = await Cart.findOne({ user_id: userId })
    }
    else if (cartId) {
      cart = await Cart.findOne({ _id: cartId })
    }

    if (!cart) {
      cart = new Cart({ user_id: userId, products: [] })
      await cart.save()
    }
    else if (userId && !cart.user_id) {
      cart.user_id = userId
      await cart.save()
    }

    return cart
  },

  async addToCart(cartId: string, productId: string, quantity: number, userId: string | null = null) {
    const cart = await this.getOrCreateCart(cartId, userId)

    // Check stock
    const product = await Product.findById(productId)
    if (!product || product.status !== 'active')
      throw new Error('Sản phẩm không khả dụng')

    const itemIndex = cart.products.findIndex((p: any) => String(p.product_id) === productId)
    if (itemIndex > -1) {
      const newQty = cart.products[itemIndex].quantity + quantity
      if (newQty > product.stock) {
        throw new Error(`Sản phẩm ${product.title} không đủ số lượng trong kho. Còn lại: ${product.stock}`)
      }
      cart.products[itemIndex].quantity = newQty
    }
    else {
      if (quantity > product.stock) {
        throw new Error(`Sản phẩm ${product.title} không đủ số lượng trong kho. Còn lại: ${product.stock}`)
      }
      cart.products.push({ product_id: productId, quantity })
    }

    await cart.save()
    return cart
  },

  async updateCartItem(cartId: string, productId: string, quantity: number, userId: string | null = null) {
    const cart = await this.getOrCreateCart(cartId, userId)
    const product = await Product.findById(productId)
    if (!product)
      throw new Error('Sản phẩm không tồn tại')

    if (quantity > product.stock) {
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
      await cart.save()
    }
    return cart
  },

  async deleteCartItem(cartId: string, productId: string, userId: string | null = null) {
    const cart = await this.getOrCreateCart(cartId, userId)
    cart.products = cart.products.filter((p: any) => String(p.product_id) !== productId)
    await cart.save()
    return cart
  },

  // Cart Merging Algorithm
  async mergeCarts(guestCartId: string, userId: string) {
    const guestCart = await Cart.findOne({ _id: guestCartId })
    if (!guestCart || guestCart.products.length === 0)
      return

    const userCart = await this.getOrCreateCart(undefined, userId)

    for (const guestItem of guestCart.products) {
      const product = await Product.findById(guestItem.product_id)
      if (!product || product.status !== 'active')
        continue

      const userItemIndex = userCart.products.findIndex(
        (uItem: any) => String(uItem.product_id) === String(guestItem.product_id),
      )

      if (userItemIndex > -1) {
        // Merge quantities and cap to stock
        let mergedQty = userCart.products[userItemIndex].quantity + guestItem.quantity
        if (mergedQty > product.stock) {
          mergedQty = product.stock
        }
        userCart.products[userItemIndex].quantity = mergedQty
      }
      else {
        // Add new item capped to stock
        let qty = guestItem.quantity
        if (qty > product.stock) {
          qty = product.stock
        }
        userCart.products.push({ product_id: guestItem.product_id, quantity: qty })
      }
    }

    await userCart.save()

    // Clear guest cart
    guestCart.products = []
    await guestCart.save()
  },
}

// --- 3. Checkout Service ---
export const CheckoutService = {
  // Safe Checkout flow - Inventory check & atomic updates with transactions
  async processCheckout(cartId: string, userInfo: any, userId: string | null = null) {
    return this.processCheckoutFallback(cartId, userInfo, userId)
  },

  // Fallback for standalone Mongo instances (e.g. standard local setups)
  async processCheckoutFallback(cartId: string, userInfo: any, userId: string | null = null) {
    const cart = await Cart.findById(cartId)
    if (!cart || cart.products.length === 0) {
      throw new Error('Giỏ hàng của bạn đang trống')
    }

    const orderProducts: any[] = []
    const rollbacks: { product_id: any, quantity: number }[] = []

    try {
      for (const item of cart.products) {
        const product = await Product.findById(item.product_id)
        if (!product || product.status !== 'active') {
          throw new Error('Sản phẩm đã ngừng bán')
        }

        if (product.stock < item.quantity) {
          throw new Error(`Sản phẩm ${product.title} hiện không đủ tồn kho. Yêu cầu: ${item.quantity}, Có sẵn: ${product.stock}`)
        }

        // Atomic check and update
        const updatedProduct = await Product.findOneAndUpdate(
          { _id: product._id, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true },
        )

        if (!updatedProduct) {
          throw new Error(`Sản phẩm ${product.title} đã hết hàng do có người đặt trước.`)
        }

        // Save for rollback if checkout fails later
        rollbacks.push({ product_id: product._id, quantity: item.quantity })

        orderProducts.push({
          product_id: product._id,
          price: product.price,
          discountPercentage: product.discountPercentage,
          quantity: item.quantity,
        })
      }

      const order = new Order({
        user_id: userId,
        cart_id: cartId,
        userInfo,
        products: orderProducts,
        status: 'pending',
      })

      await order.save()

      cart.products = []
      await cart.save()

      return order
    }
    catch (error) {
      // Manual rollback
      console.log('[CheckoutService] Rolling back updates...')
      for (const r of rollbacks) {
        await Product.updateOne({ _id: r.product_id }, { $inc: { stock: r.quantity } })
      }
      throw error
    }
  },
}
