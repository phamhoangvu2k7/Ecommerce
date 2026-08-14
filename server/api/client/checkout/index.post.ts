import { createError, defineEventHandler, deleteCookie, readBody } from 'h3'
import { CheckoutService } from '../../../utils/services.ts'
import { CheckoutValidation } from '../../../utils/validation.ts'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = CheckoutValidation.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.errors.map(e => e.message).join(', '),
    })
  }

  const { cartId, fullName, phone, address } = parsed.data
  const user = event.context.user

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Vui lòng đăng nhập tài khoản để tiến hành thanh toán đơn hàng.',
    })
  }

  try {
    const order = await CheckoutService.processCheckout(
      cartId,
      { fullName, phone, address },
      user.id,
    )

    // Clear guest cart cookie on successful checkout
    if (!user) {
      deleteCookie(event, 'cartId')
    }

    return {
      success: true,
      message: 'Đặt hàng thành công! Đơn hàng đang được xử lý.',
      order,
    }
  }
  catch (err: any) {
    throw createError({
      statusCode: 400,
      statusMessage: err.message,
    })
  }
})
