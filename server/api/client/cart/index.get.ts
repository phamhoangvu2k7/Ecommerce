import { defineEventHandler, parseCookies, setCookie } from 'h3'
import { CartService } from '../../../utils/services.ts'

export default defineEventHandler(async (event) => {
  const cookies = parseCookies(event)
  const guestCartId = cookies.cartId
  const user = event.context.user

  let cart = await CartService.getOrCreateCart(guestCartId, user ? user._id.toString() : null)

  // Set guest cart cookie if not set
  if (!user && String(cart._id) !== guestCartId) {
    setCookie(event, 'cartId', String(cart._id), {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: false, // Allow FE to read guest cart ID if needed
    })
  }

  // Populate product details in the cart
  const populatedCart = await cart.populate({
    path: 'products.product_id',
    select: 'title price discountPercentage thumbnail stock status',
  })

  const cartItems = populatedCart.products
    .map((item: any) => {
      const product = item.product_id
      if (!product)
        return null
      const priceNew = Math.round(product.price * (1 - product.discountPercentage / 100))
      return {
        product_id: product._id,
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
    cartId: cart._id,
    products: cartItems,
    totalAmount,
  }
})
