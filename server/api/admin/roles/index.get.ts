import { desc, eq } from 'drizzle-orm'
import { createError, defineEventHandler } from 'h3'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  const permissions = event.context.admin?.role_id?.permissions || []
  if (!permissions.includes('roles_view')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Bạn không có quyền xem nhóm quyền.',
    })
  }

  try {
    const roles = await db.select()
      .from(schema.roles)
      .where(eq(schema.roles.deleted, 0))
      .orderBy(desc(schema.roles.createdAt))

    const parsedRoles = roles.map((role) => {
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
      return {
        ...role,
        permissions,
      }
    })

    return {
      success: true,
      roles: parsedRoles,
    }
  }
  catch {
    throw createError({
      statusCode: 500,
      statusMessage: 'Lỗi hệ thống khi tải danh sách nhóm quyền.',
    })
  }
})
