import { and, eq } from 'drizzle-orm'
import { createError, defineEventHandler, getHeader, parseCookies } from 'h3'
import { db, schema } from 'hub:db'
import { getJwtSecret } from '../utils/helpers'
import { verifyJwt } from '../utils/jwt'

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

  // 2. Decode token and inject user/admin context
  if (token) {
    try {
      const decoded: any = await verifyJwt(token, getJwtSecret())
      if (decoded.role === 'admin') {
        const accounts = await db.select()
          .from(schema.accounts)
          .where(and(eq(schema.accounts.id, decoded.id), eq(schema.accounts.deleted, 0)))
          .limit(1)
        const account = accounts[0]
        if (account && account.status === 'active') {
          // Populate role_id
          if (account.role_id) {
            const roles = await db.select()
              .from(schema.roles)
              .where(and(eq(schema.roles.id, account.role_id), eq(schema.roles.deleted, 0)))
              .limit(1)
            const role = roles[0]
            if (role) {
              let permissions: string[] = []
              if (typeof role.permissions === 'string') {
                try {
                  permissions = JSON.parse(role.permissions)
                }
                catch {
                  permissions = []
                }
              }
              else if (Array.isArray(role.permissions)) {
                permissions = role.permissions
              }
              account.role_id = {
                ...role,
                permissions,
              } as any
            }
            else {
              account.role_id = null
            }
          }
          else {
            account.role_id = null
          }
          event.context.admin = account
        }
      }
      else {
        const users = await db.select()
          .from(schema.users)
          .where(and(eq(schema.users.id, decoded.id), eq(schema.users.deleted, 0)))
          .limit(1)
        const user = users[0]
        if (user && user.status === 'active') {
          event.context.user = user
        }
      }
    }
    // eslint-disable-next-line unused-imports/no-unused-vars
    catch (err) {
      // Token expired or invalid
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
