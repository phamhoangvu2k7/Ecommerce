import { createError, defineEventHandler, readBody } from 'h3'
import { generateOTP, sendMail } from '../../../utils/helpers.ts'
import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email } = body

  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Vui lòng nhập địa chỉ email.',
    })
  }

  const users = await db.select()
    .from(schema.users)
    .where(and(eq(schema.users.email, email), eq(schema.users.deleted, 0)))
    .limit(1)
  const user = users[0]
  if (!user) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email không tồn tại trên hệ thống.',
    })
  }

  // Generate 6-digit OTP
  const otp = generateOTP(6)
  const expireAt = new Date(Date.now() + 3 * 60 * 1000) // 3 minutes TTL

  // Delete older OTP records for this email and save new one
  await db.delete(schema.forgotPasswords).where(eq(schema.forgotPasswords.email, email))
  await db.insert(schema.forgotPasswords).values({
    id: crypto.randomUUID(),
    email,
    otp,
    expireAt: expireAt.toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  // Send Email
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #646cff;">Khôi phục mật khẩu</h2>
      <p>Chào bạn,</p>
      <p>Yêu cầu khôi phục mật khẩu của bạn đã được nhận. Dưới đây là mã OTP xác nhận của bạn:</p>
      <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 8px;">
        ${otp}
      </div>
      <p style="color: #666; font-size: 13px;">Mã OTP này có giá trị trong vòng 3 phút. Tuyệt đối không chia sẻ mã này với người khác.</p>
    </div>
  `

  try {
    await sendMail(email, 'Mã OTP Khôi phục mật khẩu', html)
  }
  catch (err: any) {
    console.error('[Mail] Error sending OTP email:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Gửi email chứa mã OTP thất bại, vui lòng kiểm tra cấu hình Mailer.',
    })
  }

  return {
    success: true,
    message: 'Gửi mã OTP thành công. Vui lòng kiểm tra hộp thư email của bạn.',
  }
})
