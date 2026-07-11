import { createError, defineEventHandler, readBody } from 'h3'
import { hashPassword } from '../../../utils/helpers.ts'
import { RegisterValidation } from '../../../utils/validation.ts'
import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = RegisterValidation.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.errors.map(e => e.message).join(', '),
    })
  }

  const { fullName, email, password, phone } = parsed.data

  const existingUsers = await db.select()
    .from(schema.users)
    .where(and(eq(schema.users.email, email), eq(schema.users.deleted, 0)))
    .limit(1)
  const existingUser = existingUsers[0]
  if (existingUser) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email này đã được đăng ký sử dụng.',
    })
  }

  const userId = crypto.randomUUID()
  await db.insert(schema.users).values({
    id: userId,
    fullName,
    email,
    password: hashPassword(password),
    phone,
    status: 'active',
    deleted: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  // Initialize an empty cart for this user
  const cartId = crypto.randomUUID()
  await db.insert(schema.carts).values({
    id: cartId,
    user_id: userId,
    products: '[]',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  return {
    success: true,
    message: 'Đăng ký tài khoản thành công.',
  }
})
