import { createError, defineEventHandler, readBody } from 'h3'
import { getJwtSecret } from '../../../utils/helpers.ts'
import { signJwt } from '../../../utils/jwt.ts'
import { ForgotPassword } from '../../../utils/models.ts'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, otp } = body

  if (!email || !otp) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Vui lòng điền đầy đủ email và mã OTP.',
    })
  }

  const record = await ForgotPassword.findOne({ email, otp })
  if (!record) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Mã OTP không đúng hoặc đã hết hạn.',
    })
  }

  // Issue temporary JWT reset token valid for 10 minutes
  const resetToken = await signJwt(
    { email, role: 'reset-password' },
    getJwtSecret(),
    { expiresIn: '10m' },
  )

  // Consume (delete) the OTP so it can't be reused
  await ForgotPassword.deleteOne({ _id: record._id })

  return {
    success: true,
    message: 'Xác thực mã OTP thành công. Vui lòng đặt mật khẩu mới.',
    resetToken,
  }
})
