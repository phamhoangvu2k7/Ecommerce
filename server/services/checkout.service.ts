import type { CartItem } from './cart.service'
import { and, eq, gte } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { kv } from 'hub:kv'

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

export const CheckoutService = {
  async processCheckout(cartId: string, userInfo: UserInfo, userId: string | null = null) {
    // 1. Fetch cart from D1 database or KV (guest cart)
    const carts = await db.select()
      .from(schema.carts)
      .where(eq(schema.carts.id, cartId))
      .limit(1)

    const cart = carts[0]
    let cartProducts: CartItem[] = []

    if (!cart) {
      // Try guest cart in KV
      const guestCart = await kv.get<any>(`cart:guest:${cartId}`)
      if (guestCart && Array.isArray(guestCart.products)) {
        cartProducts = guestCart.products
      }
      else {
        throw new Error('Giỏ hàng của bạn không tồn tại')
      }
    }
    else {
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
    }

    if (cartProducts.length === 0) {
      throw new Error('Giỏ hàng của bạn đang trống')
    }

    const orderProducts: OrderProductItem[] = []

    // 2. Validate stock & deduct inventory
    for (const item of cartProducts) {
      const prods = await db.select()
        .from(schema.products)
        .where(eq(schema.products.id, item.product_id))
        .limit(1)
      const product = prods[0]
      if (!product || product.status !== 'active' || product.deleted === 1) {
        throw new Error(`Sản phẩm ${product?.title || ''} đã ngừng bán`)
      }

      if ((product.stock || 0) < item.quantity) {
        throw new Error(`Sản phẩm ${product.title} hiện không đủ tồn kho. Yêu cầu: ${item.quantity}, Có sẵn: ${product.stock || 0}`)
      }

      await db.update(schema.products)
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

    // 3. Create Order
    const orderId = crypto.randomUUID()
    const now = new Date().toISOString()
    await db.insert(schema.orders).values({
      id: orderId,
      user_id: userId,
      cart_id: cartId,
      userInfo: JSON.stringify(userInfo) as unknown as typeof schema.orders.$inferInsert['userInfo'],
      products: JSON.stringify(orderProducts) as unknown as typeof schema.orders.$inferInsert['products'],
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    })

    // 4. Clear cart contents in D1 & KV
    if (cart) {
      await db.update(schema.carts)
        .set({
          products: JSON.stringify([]) as unknown as typeof schema.carts.$inferInsert['products'],
          updatedAt: now,
        })
        .where(eq(schema.carts.id, cartId))
    }
    try {
      await kv.del(`cart:guest:${cartId}`)
    }
    catch {}

    return {
      id: orderId,
      user_id: userId,
      cart_id: cartId,
      userInfo,
      products: orderProducts,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    }
  },
}

