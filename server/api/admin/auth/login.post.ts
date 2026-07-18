import { and, eq } from 'drizzle-orm'
import { createError, defineEventHandler, readBody, setCookie } from 'h3'
import { db, schema } from 'hub:db'
import { comparePassword, getJwtSecret } from '../../../utils/helpers'
import { signJwt } from '../../../utils/jwt'
import { LoginValidation } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Validate input
  const parsed = LoginValidation.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.errors.map(e => e.message).join(', '),
    })
  }

  const { email, password } = parsed.data

  const accounts = await db.select()
    .from(schema.accounts)
    .where(and(eq(schema.accounts.email, email), eq(schema.accounts.deleted, 0)))
    .limit(1)
  const account = accounts[0]
  if (!account) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email không tồn tại trong hệ thống',
    })
  }

  if (!comparePassword(password, account.password)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Mật khẩu không chính xác',
    })
  }

  if (account.status !== 'active') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tài khoản của bạn đã bị khóa',
    })
  }

  // Populate role_id
  let role: any = null
  if (account.role_id) {
    const roles = await db.select()
      .from(schema.roles)
      .where(and(eq(schema.roles.id, account.role_id), eq(schema.roles.deleted, 0)))
      .limit(1)
    role = roles[0] || null
    if (role && typeof role.permissions === 'string') {
      try {
        role.permissions = JSON.parse(role.permissions)
      }
      catch {
        role.permissions = []
      }
    }
  }

  // Generate JWT token
  const token = await signJwt(
    { id: account.id, role: 'admin' },
    getJwtSecret(),
    { expiresIn: '1d' },
  )

  // Set HTTP-only Cookie
  setCookie(event, 'token', token, {
    httpOnly: true,
    // eslint-disable-next-line node/prefer-global/process
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24, // 1 day
  })

  return {
    success: true,
    token,
    user: {
      id: account.id,
      fullName: account.fullName,
      email: account.email,
      phone: account.phone,
      avatar: account.avatar,
      role,
    },
  }
})
