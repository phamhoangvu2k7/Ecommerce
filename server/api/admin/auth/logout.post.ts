import { eq } from 'drizzle-orm'
import { defineEventHandler, deleteCookie, parseCookies } from 'h3'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  const cookies = parseCookies(event)
  const refreshToken = cookies.refreshToken || ''

  if (refreshToken) {
    // Revoke Refresh Token in SQLite database
    await db.update(schema.refreshTokens)
      .set({ isRevoked: 1 })
      .where(eq(schema.refreshTokens.token, refreshToken))
  }

  // Clear authentication cookies
  deleteCookie(event, 'token', { path: '/' })
  deleteCookie(event, 'refreshToken', { path: '/' })

  return {
    success: true,
    message: 'Đăng xuất thành công',
  }
})
