import { and, eq } from 'drizzle-orm'
import { createError, defineEventHandler } from 'h3'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  const permissions = event.context.admin?.role_id?.permissions || []
  if (!permissions.includes('accounts_delete')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Bạn không có quyền xóa tài khoản quản trị.',
    })
  }

  const id = event.context.params?.id
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Thiếu ID tài khoản.',
    })
  }

  if (String(id) === String(event.context.admin?.id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bạn không thể tự xóa tài khoản của chính mình.',
    })
  }

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

    await db.update(schema.accounts)
      .set({
        deleted: 1,
        deletedAt: new Date().toISOString(),
        deletedBy: event.context.admin?.id,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.accounts.id, id))

    return {
      success: true,
      message: 'Xóa tài khoản thành công.',
    }
  }
  catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Lỗi hệ thống khi xóa tài khoản quản trị.',
    })
  }
})
