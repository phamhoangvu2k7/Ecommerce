import { createError, defineEventHandler, readBody } from 'h3'
import { hashPassword } from '../../../utils/helpers.ts'
import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const permissions = event.context.admin?.role_id?.permissions || []
  if (!permissions.includes('accounts_create')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Bạn không có quyền tạo tài khoản quản trị.',
    })
  }

  const body = await readBody(event)
  if (!body.fullName || !body.email || !body.password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Vui lòng nhập đầy đủ thông tin bắt buộc.',
    })
  }

  try {
    const existingAccounts = await db.select()
      .from(schema.accounts)
      .where(and(eq(schema.accounts.email, body.email), eq(schema.accounts.deleted, 0)))
      .limit(1)
    const existing = existingAccounts[0]
    if (existing) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email này đã được sử dụng.',
      })
    }

    const accountId = crypto.randomUUID()
    const accountData = {
      id: accountId,
      fullName: body.fullName,
      email: body.email,
      password: hashPassword(body.password),
      role_id: body.role_id || null,
      phone: body.phone || '',
      avatar: body.avatar || '',
      status: body.status || 'active',
      deleted: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await db.insert(schema.accounts).values(accountData)

    return {
      success: true,
      account: accountData,
    }
  }
  catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Lỗi hệ thống khi tạo tài khoản quản trị.',
    })
  }
})
