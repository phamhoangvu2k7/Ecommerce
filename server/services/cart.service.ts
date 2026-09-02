import { eq, inArray } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { kv } from 'hub:kv'

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

export const CartService = {
  async getOrCreateCart(cartId?: string, userId: string | null = null): Promise<CartData> {
    let cart: CartData | null = null

    if (userId) {
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
        await kv.set(`cart:guest:${newCartId}`, cart, { ttl: 86400 })
      }
    }

    return cart
  },

  async addToCart(cartId: string, productId: string, quantity: number, userId: string | null = null): Promise<CartData> {
    const cart = await this.getOrCreateCart(cartId, userId)

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
      cart.updatedAt = new Date().toISOString()
      await kv.set(`cart:guest:${cart.id}`, cart, { ttl: 86400 })
    }
    else {
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
        cart.updatedAt = new Date().toISOString()
        await kv.set(`cart:guest:${cart.id}`, cart, { ttl: 86400 })
      }
      else {
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
      cart.updatedAt = new Date().toISOString()
      await kv.set(`cart:guest:${cart.id}`, cart, { ttl: 86400 })
    }
    else {
      await db.update(schema.carts)
        .set({
          products: JSON.stringify(cart.products) as unknown as typeof schema.carts.$inferInsert['products'],
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.carts.id, cart.id))
    }
    return cart
  },

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

    const productIds = [...new Set(guestProducts.map(i => i.product_id).filter(Boolean))] as string[]
    if (productIds.length === 0)
      return

    const prods = await db.select()
      .from(schema.products)
      .where(inArray(schema.products.id, productIds))
    const productMap = new Map(prods.map(p => [p.id, p]))

    for (const guestItem of guestProducts) {
      const product = productMap.get(guestItem.product_id)
      if (!product || product.status !== 'active' || product.deleted === 1)
        continue

      const userItemIndex = userCart.products.findIndex(
        uItem => String(uItem.product_id) === String(guestItem.product_id),
      )

      if (userItemIndex > -1) {
        let mergedQty = userCart.products[userItemIndex].quantity + guestItem.quantity
        if (mergedQty > (product.stock || 0)) {
          mergedQty = product.stock || 0
        }
        userCart.products[userItemIndex].quantity = mergedQty
      }
      else {
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

    await kv.del(guestCartKey)
  },
}
