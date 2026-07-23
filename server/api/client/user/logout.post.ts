import { eq } from 'drizzle-orm'
import { defineEventHandler, deleteCookie, getHeader, parseCookies } from 'h3'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  let refreshToken = ''
  const cookies = parseCookies(event)
  refreshToken = cookies.refreshToken || ''

  if (!refreshToken) {
    const authHeader = getHeader(event, 'authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      refreshToken = authHeader.substring(7)
    }
  }

  if (refreshToken) {
    // Revoke Refresh Token in SQLite database
    await db.update(schema.refreshTokens)
      .set({ isRevoked: 1 })
      .where(eq(schema.refreshTokens.token, refreshToken))
  }

  // Clear authentication cookies
  deleteCookie(event, 'token')
  deleteCookie(event, 'refreshToken')

  return {
    success: true,
    message: 'Đăng xuất thành công.',
  }
})
