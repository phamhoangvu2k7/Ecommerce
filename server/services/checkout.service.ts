import type { CartItem } from './cart.service'
import { and, eq, gte } from 'drizzle-orm'
import { db, schema } from 'hub:db'

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

      await tx.update(schema.carts)
        .set({
          products: [],
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.carts.id, cartId))

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
