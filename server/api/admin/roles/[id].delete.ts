import { createError, defineEventHandler } from 'h3'
import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const permissions = event.context.admin?.role_id?.permissions || []
  if (!permissions.includes('roles_delete')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Bạn không có quyền xóa nhóm quyền.',
    })
  }

  const id = event.context.params?.id
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Thiếu ID nhóm quyền.',
    })
  }

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

    await db.update(schema.roles)
      .set({
        deleted: 1,
        deletedAt: new Date().toISOString(),
        deletedBy: event.context.admin?.id,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.roles.id, id))

    return {
      success: true,
      message: 'Xóa nhóm quyền thành công.',
    }
  }
  catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Lỗi hệ thống khi xóa nhóm quyền.',
    })
  }
})
