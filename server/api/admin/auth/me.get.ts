import { createError, defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  if (!event.context.admin) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Chưa đăng nhập tài khoản quản trị.',
    })
  }

  return {
    success: true,
    user: {
      id: event.context.admin._id,
      fullName: event.context.admin.fullName,
      email: event.context.admin.email,
      phone: event.context.admin.phone,
      avatar: event.context.admin.avatar,
      role: event.context.admin.role_id,
    },
  }
})
