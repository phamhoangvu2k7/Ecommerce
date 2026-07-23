import { and, eq } from 'drizzle-orm'
import { createError, defineEventHandler, deleteCookie, parseCookies, readBody, setCookie } from 'h3'
import { db, schema } from 'hub:db'
import { comparePassword, getJwtSecret } from '../../../utils/helpers'
import { signAccessToken, signRefreshToken } from '../../../utils/jwt'
import { CartService } from '../../../utils/services'
import { LoginValidation } from '../../../utils/validation'

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

  const users = await db.select()
    .from(schema.users)
    .where(and(eq(schema.users.email, email), eq(schema.users.deleted, 0)))
    .limit(1)
  const user = users[0]
  if (!user) {
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
      await CartService.mergeCarts(guestCartId, user.id)
      deleteCookie(event, 'cartId')
    }
    catch (err) {
      console.error('[CartMerging] Failed to merge carts on login:', err)
    }
  }

  // Issue Dual Tokens (Access Token 15m + Refresh Token 7d)
  const token = await signAccessToken({ id: user.id, role: 'client' }, getJwtSecret())
  const refreshToken = await signRefreshToken({ id: user.id, role: 'client' }, getJwtSecret())

  // Store Refresh Token record in SQLite
  const refreshTokenId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  await db.insert(schema.refreshTokens).values({
    id: refreshTokenId,
    user_id: user.id,
    token: refreshToken,
    expiresAt,
    isRevoked: 0,
  })

  // Set Cookies
  setCookie(event, 'token', token, {
    httpOnly: true,
    // eslint-disable-next-line node/prefer-global/process
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 15, // 15 minutes
  })

  setCookie(event, 'refreshToken', refreshToken, {
    httpOnly: true,
    // eslint-disable-next-line node/prefer-global/process
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  return {
    success: true,
    message: 'Đăng nhập thành công.',
    token,
    refreshToken,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
    },
  }
})
