import { createError, defineEventHandler, readBody } from 'h3'
import { UserService } from '../../../services/user.service'
import { RegisterValidation } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = RegisterValidation.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.errors.map(e => e.message).join(', '),
    })
  }

  try {
    await UserService.register(parsed.data)
    return {
      success: true,
      message: 'Đăng ký tài khoản thành công.',
    }
  }
  catch (err: any) {
    throw createError({
      statusCode: 400,
      statusMessage: err.message || 'Đăng ký thất bại.',
    })
  }
})
