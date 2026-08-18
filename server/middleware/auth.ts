import { createError, defineEventHandler, getHeader, parseCookies } from 'h3'
import { getJwtSecret } from '../utils/helpers'
import { verifyJwt } from '../utils/jwt'

interface AuthJwtPayload {
  id: string
  role: string
  fullName?: string
  email?: string
  phone?: string
  avatar?: string
  permissions?: string[]
}

export default defineEventHandler(async (event) => {
  const path = event.path || ''

  // 1. Extract token from Authorization header or Cookie (prioritizing header)
  let token = ''
  const authHeader = getHeader(event, 'authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }

  if (!token) {
    const cookies = parseCookies(event)
    token = cookies.token || ''
  }

  // 2. Decode token and inject user/admin context (Zero-DB Lookup Auth)
  if (token) {
    try {
      const decoded = await verifyJwt<AuthJwtPayload>(token, getJwtSecret())
      if (decoded.role === 'admin') {
        event.context.admin = {
          id: decoded.id,
          fullName: decoded.fullName || '',
          email: decoded.email || '',
          phone: decoded.phone || '',
          avatar: decoded.avatar || '',
          role_id: {
            permissions: Array.isArray(decoded.permissions) ? decoded.permissions : [],
          },
        }
      }
      else if (decoded.role === 'client') {
        event.context.user = {
          id: decoded.id,
          fullName: decoded.fullName || '',
          email: decoded.email || '',
          phone: decoded.phone || '',
          avatar: decoded.avatar || '',
        }
      }
    }
    catch {
      console.warn('[AuthMiddleware] JWT Token verification failed.')
    }
  }

  // 3. Enforce Route-level Authentication Checks
  // Protect all admin APIs except /api/admin/auth/login
  if (path.startsWith('/api/admin') && !path.startsWith('/api/admin/auth/login')) {
    if (!event.context.admin) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Bạn cần đăng nhập bằng tài khoản quản trị để truy cập.',
      })
    }
  }
})
