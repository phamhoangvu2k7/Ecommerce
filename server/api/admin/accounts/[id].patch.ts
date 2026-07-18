import { and, eq } from 'drizzle-orm'
import { createError, defineEventHandler, readBody } from 'h3'
import { db, schema } from 'hub:db'
import { hashPassword } from '../../../utils/helpers.ts'

export default defineEventHandler(async (event) => {
  const permissions = event.context.admin?.role_id?.permissions || []
  if (!permissions.includes('accounts_edit')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Bạn không có quyền chỉnh sửa tài khoản quản trị.',
    })
  }

  const id = event.context.params?.id
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Thiếu ID tài khoản.',
    })
  }

  const body = await readBody(event)

  try {
    const accounts = await db.select()
      .from(schema.accounts)
      .where(and(eq(schema.accounts.id, id), eq(schema.accounts.deleted, 0)))
      .limit(1)
    const account = accounts[0]
    if (!account) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Không tìm thấy tài khoản quản trị.',
      })
    }

    const updateData: any = {}
    if (body.email && body.email !== account.email) {
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
      updateData.email = body.email
    }

    if (body.fullName !== undefined)
      updateData.fullName = body.fullName
    if (body.password)
      updateData.password = hashPassword(body.password)
    if (body.role_id !== undefined)
      updateData.role_id = body.role_id || null
    if (body.phone !== undefined)
      updateData.phone = body.phone
    if (body.avatar !== undefined)
      updateData.avatar = body.avatar
    if (body.status !== undefined)
      updateData.status = body.status

    updateData.updatedAt = new Date().toISOString()

    await db.update(schema.accounts)
      .set(updateData)
      .where(eq(schema.accounts.id, id))

    const updatedAccounts = await db.select()
      .from(schema.accounts)
      .where(eq(schema.accounts.id, id))
      .limit(1)
    const updatedAccount = updatedAccounts[0]

    return {
      success: true,
      account: updatedAccount,
    }
  }
  catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Lỗi hệ thống khi cập nhật tài khoản quản trị.',
    })
  }
})
