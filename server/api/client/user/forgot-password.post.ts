import { and, eq } from 'drizzle-orm'
import { createError, defineEventHandler, readBody } from 'h3'
import { db, schema } from 'hub:db'
import { kv } from 'hub:kv'
import { generateOTP, sendMail } from '../../../utils/helpers'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email } = body

  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Vui lòng nhập địa chỉ email.',
    })
  }

  const cleanEmail = String(email).trim().toLowerCase()

  const users = await db.select()
    .from(schema.users)
    .where(and(eq(schema.users.email, cleanEmail), eq(schema.users.deleted, 0)))
    .limit(1)
  const user = users[0]
  if (!user) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email không tồn tại trên hệ thống.',
    })
  }

  const limitKey = `rate_limit:otp:${cleanEmail}`
  const attempts = (await kv.get<number>(limitKey)) || 0
  if (attempts >= 3) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Bạn đã yêu cầu gửi OTP quá nhiều lần. Vui lòng thử lại sau 5 phút.',
    })
  }

  // Generate 6-digit OTP
  const otp = generateOTP(6)

  // Save OTP to Cloudflare KV as string with 3 minutes TTL (180 seconds)
  await kv.set(`otp:forgot-password:${cleanEmail}`, String(otp), { ttl: 180 })

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
    await sendMail(cleanEmail, 'Mã OTP Khôi phục mật khẩu', html)
    // Increment attempts counter in KV with 5 minutes TTL
    await kv.set(limitKey, attempts + 1, { ttl: 300 })
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
