import { and, eq } from 'drizzle-orm'
import { createError, defineEventHandler, parseCookies, setCookie } from 'h3'
import { db, schema } from 'hub:db'
import { getJwtSecret } from '../../../utils/helpers'
import { signAccessToken, signRefreshToken, verifyJwt } from '../../../utils/jwt'

interface RefreshTokenPayload {
  id: string
  role: string
}

export default defineEventHandler(async (event) => {
  // Read refresh token directly from httpOnly Cookie for Web
  const cookies = parseCookies(event)
  const refreshToken = cookies.refreshToken || ''

  if (!refreshToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Refresh token không tồn tại trong Cookie.',
    })
  }

  // Verify JWT signature
  let decoded: RefreshTokenPayload
  try {
    decoded = await verifyJwt<RefreshTokenPayload>(refreshToken, getJwtSecret())
  }
  catch {
    throw createError({
      statusCode: 401,
      statusMessage: 'Refresh token không hợp lệ hoặc đã hết hạn.',
    })
  }

  if (decoded.role !== 'admin' || !decoded.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Refresh token không đúng quyền hạn admin.',
    })
  }

  // Check refresh token in SQLite database
  const tokenRecords = await db.select()
    .from(schema.refreshTokens)
    .where(and(
      eq(schema.refreshTokens.token, refreshToken),
      eq(schema.refreshTokens.account_id, decoded.id),
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

  // Verify admin account status
  const accounts = await db.select()
    .from(schema.accounts)
    .where(and(eq(schema.accounts.id, decoded.id), eq(schema.accounts.deleted, 0)))
    .limit(1)
  const account = accounts[0]
  if (!account || account.status !== 'active') {
    throw createError({
      statusCode: 401,
      statusMessage: 'Tài khoản admin không tồn tại hoặc đã bị khóa.',
    })
  }

  let permissions: string[] = []
  if (account.role_id) {
    const roles = await db.select()
      .from(schema.roles)
      .where(and(eq(schema.roles.id, account.role_id), eq(schema.roles.deleted, 0)))
      .limit(1)
    const role = roles[0]
    if (role && Array.isArray(role.permissions)) {
      permissions = role.permissions
    }
    else if (role && typeof role.permissions === 'string') {
      try {
        permissions = JSON.parse(role.permissions)
      }
      catch {}
    }
  }

  // Refresh Token Rotation (RTR): Revoke old refresh token & issue a new pair
  await db.update(schema.refreshTokens)
    .set({ isRevoked: 1 })
    .where(eq(schema.refreshTokens.id, tokenRecord.id))

  const newAccessToken = await signAccessToken({
    id: account.id,
    role: 'admin',
    fullName: account.fullName,
    email: account.email,
    phone: account.phone || '',
    avatar: account.avatar || '',
    permissions,
  }, getJwtSecret())
  const newRefreshToken = await signRefreshToken({ id: account.id, role: 'admin' }, getJwtSecret())

  const newRefreshTokenId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  await db.insert(schema.refreshTokens).values({
    id: newRefreshTokenId,
    account_id: account.id,
    token: newRefreshToken,
    expiresAt,
    isRevoked: 0,
  })

  // Set updated cookies
  setCookie(event, 'token', newAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 15, // 15 minutes
  })

  setCookie(event, 'refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  return {
    success: true,
    message: 'Gia hạn token admin thành công.',
    token: newAccessToken,
    refreshToken: newRefreshToken,
  }
})
