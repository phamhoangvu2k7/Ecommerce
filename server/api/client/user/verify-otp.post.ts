import { createError, defineEventHandler, readBody } from 'h3'
import { kv } from 'hub:kv'
import { getJwtSecret } from '../../../utils/helpers'
import { signJwt } from '../../../utils/jwt'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, otp } = body

  if (!email || !otp) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Vui lòng điền đầy đủ email và mã OTP.',
    })
  }

  const cleanEmail = String(email).trim().toLowerCase()
  const cleanOtp = String(otp).trim()

  const savedOtp = await kv.get(`otp:forgot-password:${cleanEmail}`)

  if (!savedOtp || String(savedOtp).trim() !== cleanOtp) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Mã OTP không đúng hoặc đã hết hạn.',
    })
  }

  // Issue temporary JWT reset token valid for 10 minutes
  const resetToken = await signJwt(
    { email: cleanEmail, role: 'reset-password' },
    getJwtSecret(),
    { expiresIn: '10m' },
  )

  // Consume (delete) the OTP so it can't be reused
  await kv.del(`otp:forgot-password:${cleanEmail}`)

  return {
    success: true,
    message: 'Xác thực mã OTP thành công. Vui lòng đặt mật khẩu mới.',
    resetToken,
  }
})
