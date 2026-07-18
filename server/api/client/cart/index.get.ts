import { and, eq, inArray } from 'drizzle-orm'
import { defineEventHandler, parseCookies, setCookie } from 'h3'
import { db, schema } from 'hub:db'
import { CartService } from '../../../utils/services'

export default defineEventHandler(async (event) => {
  const cookies = parseCookies(event)
  const guestCartId = cookies.cartId
  const user = event.context.user

  const cart = await CartService.getOrCreateCart(guestCartId, user ? user.id : null)

  // Set guest cart cookie if not set
  if (!user && String(cart.id) !== guestCartId) {
    setCookie(event, 'cartId', String(cart.id), {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: false, // Allow FE to read guest cart ID if needed
    })
  }

  // Fetch product details for the products inside the cart
  const productIds = (cart.products || []).map((p: any) => p.product_id).filter(Boolean)
  let productsList: any[] = []
  if (productIds.length > 0) {
    productsList = await db.select()
      .from(schema.products)
      .where(and(
        inArray(schema.products.id, productIds),
        eq(schema.products.deleted, 0),
      ))
  }

  const productMap = productsList.reduce((map: any, prod: any) => {
    map[prod.id] = prod
    return map
  }, {})

  const cartItems = (cart.products || [])
    .map((item: any) => {
      const product = productMap[item.product_id]
      if (!product)
        return null
      const priceNew = Math.round(product.price * (1 - (product.discountPercentage || 0) / 100))
      return {
        product_id: product.id,
        title: product.title,
        price: product.price,
        discountPercentage: product.discountPercentage,
        priceNew,
        thumbnail: product.thumbnail,
        stock: product.stock,
        status: product.status,
        quantity: item.quantity,
        totalPrice: priceNew * item.quantity,
      }
    })
    .filter(Boolean)

  const totalAmount = cartItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0)

  return {
    success: true,
    cartId: cart.id,
    products: cartItems,
    totalAmount,
  }
})
