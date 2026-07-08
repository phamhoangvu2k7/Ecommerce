import { createError, defineEventHandler, deleteCookie, parseCookies, readBody, setCookie } from 'h3'
import { comparePassword, getJwtSecret } from '../../../utils/helpers.ts'
import { signJwt } from '../../../utils/jwt.ts'
import { User } from '../../../utils/models.ts'
import { CartService } from '../../../utils/services.ts'
import { LoginValidation } from '../../../utils/validation.ts'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = LoginValidation.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.errors.map(e => e.message).join(', '),
    })
  }

  const { email, password } = parsed.data

  const user = await User.findOne({ email })
  if (!user || user.deleted) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email hoặc mật khẩu không chính xác.',
    })
  }

  if (!comparePassword(password, user.password)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email hoặc mật khẩu không chính xác.',
    })
  }

  if (user.status !== 'active') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tài khoản của bạn đang bị khóa.',
    })
  }

  // --- Cart Merging Algorithm ---
  const cookies = parseCookies(event)
  const guestCartId = cookies.cartId
  if (guestCartId) {
    try {
      await CartService.mergeCarts(guestCartId, user._id.toString())
      deleteCookie(event, 'cartId')
    }
    catch (err) {
      console.error('[CartMerging] Failed to merge carts on login:', err)
    }
  }

  // Issue Token
  const token = await signJwt(
    { id: user._id, role: 'client' },
    getJwtSecret(),
    { expiresIn: '7d' },
  )

  // Set Cookie
  setCookie(event, 'token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  return {
    success: true,
    message: 'Đăng nhập thành công.',
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
    },
  }
})
