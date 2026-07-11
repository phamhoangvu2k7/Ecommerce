import { createError, defineEventHandler, readBody } from 'h3'
import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const permissions = event.context.admin?.role_id?.permissions || []
  if (!permissions.includes('roles_permissions') && !permissions.includes('roles_edit')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Bạn không có quyền chỉnh sửa nhóm quyền.',
    })
  }

  const id = event.context.params?.id
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Thiếu ID nhóm quyền.',
    })
  }

  const body = await readBody(event)

  try {
    const roles = await db.select()
      .from(schema.roles)
      .where(and(eq(schema.roles.id, id), eq(schema.roles.deleted, 0)))
      .limit(1)
    const role = roles[0]
    if (!role) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Không tìm thấy nhóm quyền.',
      })
    }

    const updateData: any = {}
    if (body.title !== undefined)
      updateData.title = body.title
    if (body.description !== undefined)
      updateData.description = body.description
    if (body.permissions !== undefined)
      updateData.permissions = JSON.stringify(body.permissions)
    
    updateData.updatedAt = new Date().toISOString()

    await db.update(schema.roles)
      .set(updateData)
      .where(eq(schema.roles.id, id))

    const updatedRoles = await db.select()
      .from(schema.roles)
      .where(eq(schema.roles.id, id))
      .limit(1)
    const updatedRole = updatedRoles[0]

    if (updatedRole && typeof updatedRole.permissions === 'string') {
      try {
        updatedRole.permissions = JSON.parse(updatedRole.permissions)
      } catch {
        updatedRole.permissions = []
      }
    }

    return {
      success: true,
      role: updatedRole,
    }
  }
  catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Lỗi hệ thống khi cập nhật nhóm quyền.',
    })
  }
})
