import { createError, defineEventHandler } from 'h3'
import { db, schema } from 'hub:db'
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const permissions = event.context.admin?.role_id?.permissions || []
  if (!permissions.includes('accounts_view')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Bạn không có quyền xem tài khoản quản trị.',
    })
  }

  try {
    const rows = await db.select({
      account: schema.accounts,
      role: schema.roles,
    })
    .from(schema.accounts)
    .leftJoin(schema.roles, eq(schema.accounts.role_id, schema.roles.id))
    .where(eq(schema.accounts.deleted, 0))
    .orderBy(desc(schema.accounts.createdAt))

    const accounts = rows.map(row => {
      let role = row.role || null
      if (role && typeof role.permissions === 'string') {
        try {
          role.permissions = JSON.parse(role.permissions)
        } catch {
          role.permissions = []
        }
      }
      return {
        ...row.account,
        role_id: role,
      }
    })

    return {
      success: true,
      accounts,
    }
  }
  catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Lỗi hệ thống khi tải danh sách tài khoản quản trị.',
    })
  }
})
