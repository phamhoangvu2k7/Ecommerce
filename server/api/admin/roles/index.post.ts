import { createError, defineEventHandler, readBody } from 'h3'
import { Role } from '../../../utils/models.ts'

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
    const role = new Role({
      title: body.title,
      description: body.description || '',
      permissions: body.permissions || [],
    })

    await role.save()

    return {
      success: true,
      role,
    }
  }
  catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Lỗi hệ thống khi tạo nhóm quyền.',
    })
  }
})
