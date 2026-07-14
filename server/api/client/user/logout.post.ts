import { defineEventHandler, deleteCookie, getHeader, parseCookies } from 'h3'
import { kv } from 'hub:kv'

export default defineEventHandler(async (event) => {
  let token = ''
  const authHeader = getHeader(event, 'authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }

  if (!token) {
    const cookies = parseCookies(event)
    token = cookies.token || ''
  }

  if (token) {
    // Add token to blacklist with 1 day TTL (matching cookie/JWT maxAge)
    await kv.set(`blacklist:token:${token}`, true, { ttl: 86400 })
  }

  deleteCookie(event, 'token')
  return {
    success: true,
    message: 'Đăng xuất thành công.',
  }
})
