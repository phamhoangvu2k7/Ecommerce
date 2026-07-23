import { and, eq } from 'drizzle-orm'
import { createError, defineEventHandler, getHeader, parseCookies, readBody, setCookie } from 'h3'
import { db, schema } from 'hub:db'
import { getJwtSecret } from '../../../utils/helpers'
import { signAccessToken, signRefreshToken, verifyJwt } from '../../../utils/jwt'

export default defineEventHandler(async (event) => {
  let refreshToken = ''

  // Read refresh token from Authorization header or Cookie or Body
  const authHeader = getHeader(event, 'authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    refreshToken = authHeader.substring(7)
  }

  if (!refreshToken) {
    const cookies = parseCookies(event)
    refreshToken = cookies.refreshToken || ''
  }

  if (!refreshToken) {
    try {
      const body = await readBody(event)
      refreshToken = body?.refreshToken || ''
    }
    catch {}
  }

  if (!refreshToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Refresh token không tồn tại.',
    })
  }

  // Verify JWT signature
  let decoded: any
  try {
    decoded = await verifyJwt(refreshToken, getJwtSecret())
  }
  catch {
    throw createError({
      statusCode: 401,
      statusMessage: 'Refresh token không hợp lệ hoặc đã hết hạn.',
    })
  }

  if (decoded.role !== 'client' || !decoded.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Refresh token không đúng quyền hạn.',
    })
  }

  // Check refresh token in SQLite database
  const tokenRecords = await db.select()
    .from(schema.refreshTokens)
    .where(and(
      eq(schema.refreshTokens.token, refreshToken),
      eq(schema.refreshTokens.user_id, decoded.id),
      eq(schema.refreshTokens.isRevoked, 0),
    ))
    .limit(1)

  const tokenRecord = tokenRecords[0]
  if (!tokenRecord) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Refresh token đã bị thu hồi hoặc không tồn tại.',
    })
  }

  // Verify user status
  const users = await db.select()
    .from(schema.users)
    .where(and(eq(schema.users.id, decoded.id), eq(schema.users.deleted, 0)))
    .limit(1)
  const user = users[0]
  if (!user || user.status !== 'active') {
    throw createError({
      statusCode: 401,
      statusMessage: 'Tài khoản không tồn tại hoặc đã bị khóa.',
    })
  }

  // Refresh Token Rotation (RTR): Revoke old refresh token & issue a new pair
  await db.update(schema.refreshTokens)
    .set({ isRevoked: 1 })
    .where(eq(schema.refreshTokens.id, tokenRecord.id))

  const newAccessToken = await signAccessToken({ id: user.id, role: 'client' }, getJwtSecret())
  const newRefreshToken = await signRefreshToken({ id: user.id, role: 'client' }, getJwtSecret())

  const newRefreshTokenId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  await db.insert(schema.refreshTokens).values({
    id: newRefreshTokenId,
    user_id: user.id,
    token: newRefreshToken,
    expiresAt,
    isRevoked: 0,
  })

  // Set updated cookies
  setCookie(event, 'token', newAccessToken, {
    httpOnly: true,
    // eslint-disable-next-line node/prefer-global/process
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 15, // 15 minutes
  })

  setCookie(event, 'refreshToken', newRefreshToken, {
    httpOnly: true,
    // eslint-disable-next-line node/prefer-global/process
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  return {
    success: true,
    message: 'Gia hạn token thành công.',
    token: newAccessToken,
    refreshToken: newRefreshToken,
  }
})
