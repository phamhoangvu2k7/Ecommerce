import { createError, defineEventHandler, parseCookies, readBody } from 'h3'
import { CartService } from '../../../utils/services.ts'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { productId } = body

  if (!productId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Yêu cầu mã sản phẩm cần xóa khỏi giỏ hàng.',
    })
  }

  const cookies = parseCookies(event)
  const guestCartId = cookies.cartId
  const user = event.context.user

  const cart = await CartService.getOrCreateCart(guestCartId, user ? user.id : null)

  try {
    await CartService.deleteCartItem(String(cart.id), productId, user ? user.id : null)
    return {
      success: true,
      message: 'Xóa sản phẩm khỏi giỏ hàng thành công.',
    }
  }
  catch (err: any) {
    throw createError({
      statusCode: 400,
      statusMessage: err.message,
    })
  }
})
