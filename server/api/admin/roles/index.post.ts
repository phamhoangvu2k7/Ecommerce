import { createError, defineEventHandler, readBody } from 'h3'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  const permissions = event.context.admin?.role_id?.permissions || []
  if (!permissions.includes('roles_create')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Bạn không có quyền tạo nhóm quyền.',
    })
  }

  const body = await readBody(event)
  if (!body.title) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tiêu đề nhóm quyền không được để trống.',
    })
  }

  try {
    const roleId = crypto.randomUUID()
    const title = body.title
    const description = body.description || ''
    const perms = body.permissions || []

    await db.insert(schema.roles).values({
      id: roleId,
      title,
      description,
      permissions: JSON.stringify(perms) as any,
      deleted: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    return {
      success: true,
      role: {
        id: roleId,
        title,
        description,
        permissions: perms,
      },
    }
  }
  catch {
    throw createError({
      statusCode: 500,
      statusMessage: 'Lỗi hệ thống khi tạo nhóm quyền.',
    })
  }
})
