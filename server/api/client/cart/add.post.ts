import { createError, defineEventHandler, parseCookies, readBody } from 'h3'
import { CartService } from '../../../utils/services.ts'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { productId, quantity } = body

  if (!productId || !quantity || quantity <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Thông tin sản phẩm hoặc số lượng không hợp lệ.',
    })
  }

  const cookies = parseCookies(event)
  const guestCartId = cookies.cartId
  const user = event.context.user

  const cart = await CartService.getOrCreateCart(guestCartId, user ? user._id.toString() : null)

  try {
    await CartService.addToCart(String(cart._id), productId, Number(quantity), user ? user._id.toString() : null)
    return {
      success: true,
      message: 'Thêm sản phẩm vào giỏ hàng thành công.',
    }
  }
  catch (err: any) {
    throw createError({
      statusCode: 400,
      statusMessage: err.message,
    })
  }
})
