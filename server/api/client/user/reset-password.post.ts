import { createError, defineEventHandler, readBody } from 'h3'
import { getJwtSecret, hashPassword } from '../../../utils/helpers.ts'
import { verifyJwt } from '../../../utils/jwt.ts'
import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { resetToken, password } = body

  if (!resetToken || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Thiếu thông tin khôi phục mật khẩu.',
    })
  }

  if (password.length < 6) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Mật khẩu mới phải chứa ít nhất 6 ký tự.',
    })
  }

  try {
    const decoded: any = await verifyJwt(resetToken, getJwtSecret())
    if (decoded.role !== 'reset-password') {
      throw new Error()
    }

    const email = decoded.email
    const users = await db.select()
      .from(schema.users)
      .where(and(eq(schema.users.email, email), eq(schema.users.deleted, 0)))
      .limit(1)
    const user = users[0]
    if (!user) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Tài khoản người dùng không tồn tại.',
      })
    }

    await db.update(schema.users)
      .set({
        password: hashPassword(password),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.users.id, user.id))

    return {
      success: true,
      message: 'Đổi mật khẩu mới thành công. Hãy đăng nhập lại bằng mật khẩu mới.',
    }
  }
  catch (err) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Mã xác thực đổi mật khẩu đã hết hạn hoặc không hợp lệ.',
    })
  }
})
