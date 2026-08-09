import { and, desc, eq, inArray } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { kv } from 'hub:kv'
import { comparePassword, generateOTP, getJwtSecret, hashPassword, sendMail } from '../utils/helpers'
import { signAccessToken, signJwt, signRefreshToken, verifyJwt } from '../utils/jwt'

export const UserService = {
  async register(data: { fullName: string, email: string, password: string, phone?: string }) {
    const { fullName, email, password, phone } = data

    const existingUsers = await db.select()
      .from(schema.users)
      .where(and(eq(schema.users.email, email), eq(schema.users.deleted, 0)))
      .limit(1)

    if (existingUsers[0]) {
      throw new Error('Email này đã được đăng ký sử dụng.')
    }

    const userId = crypto.randomUUID()
    const now = new Date().toISOString()

    await db.insert(schema.users).values({
      id: userId,
      fullName,
      email,
      password: hashPassword(password),
      phone,
      status: 'active',
      deleted: 0,
      createdAt: now,
      updatedAt: now,
    })

    const cartId = crypto.randomUUID()
    await db.insert(schema.carts).values({
      id: cartId,
      user_id: userId,
      products: [],
      createdAt: now,
      updatedAt: now,
    })

    return { userId, fullName, email }
  },

  async login(email: string, password: string) {
    const users = await db.select()
      .from(schema.users)
      .where(and(eq(schema.users.email, email), eq(schema.users.deleted, 0)))
      .limit(1)

    const user = users[0]
    if (!user || !comparePassword(password, user.password)) {
      throw new Error('Email hoặc mật khẩu không chính xác.')
    }

    if (user.status !== 'active') {
      throw new Error('Tài khoản của bạn đang bị khóa.')
    }

    const secret = getJwtSecret()
    const token = await signAccessToken({ id: user.id, role: 'client' }, secret)
    const refreshToken = await signRefreshToken({ id: user.id, role: 'client' }, secret)

    const refreshTokenId = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    await db.insert(schema.refreshTokens).values({
      id: refreshTokenId,
      user_id: user.id,
      token: refreshToken,
      expiresAt,
      isRevoked: 0,
    })

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
      },
      token,
      refreshToken,
    }
  },

  async getUserOrders(userId: string) {
    const orders = await db.select()
      .from(schema.orders)
      .where(and(eq(schema.orders.user_id, userId), eq(schema.orders.deleted, 0)))
      .orderBy(desc(schema.orders.createdAt))

    const parsedOrders = orders.map((order) => {
      let orderProducts: any[] = []
      if (typeof order.products === 'string') {
        try {
          orderProducts = JSON.parse(order.products)
        }
        catch {
          orderProducts = []
        }
      }
      else if (Array.isArray(order.products)) {
        orderProducts = order.products
      }

      let userInfo: any = {}
      if (typeof order.userInfo === 'string') {
        try {
          userInfo = JSON.parse(order.userInfo)
        }
        catch {
          userInfo = {}
        }
      }
      else if (order.userInfo) {
        userInfo = order.userInfo
      }

      return {
        ...order,
        products: orderProducts,
        userInfo,
      }
    })

    const productIds = [...new Set(parsedOrders.flatMap(o => o.products.map((p: any) => p.product_id)).filter(Boolean))] as string[]
    if (productIds.length > 0) {
      const products = await db.select()
        .from(schema.products)
        .where(inArray(schema.products.id, productIds))
      const productMap = new Map(products.map(p => [p.id, p]))

      parsedOrders.forEach((o) => {
        o.products.forEach((p: any) => {
          p.product_id = productMap.get(p.product_id) || null
        })
      })
    }

    return parsedOrders
  },

  async forgotPassword(email: string) {
    const cleanEmail = email.trim().toLowerCase()
    const users = await db.select()
      .from(schema.users)
      .where(and(eq(schema.users.email, cleanEmail), eq(schema.users.deleted, 0)))
      .limit(1)

    const user = users[0]
    if (!user) {
      throw new Error('Email không tồn tại trên hệ thống.')
    }

    const limitKey = `rate_limit:otp:${cleanEmail}`
    const attempts = (await kv.get<number>(limitKey)) || 0
    if (attempts >= 3) {
      throw new Error('Bạn đã yêu cầu gửi OTP quá nhiều lần. Vui lòng thử lại sau 5 phút.')
    }

    const otp = generateOTP(6)
    await kv.set(`otp:forgot-password:${cleanEmail}`, String(otp), { ttl: 180 })

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

    await sendMail(cleanEmail, 'Mã OTP Khôi phục mật khẩu', html)
    await kv.set(limitKey, attempts + 1, { ttl: 300 })

    return { email: cleanEmail }
  },

  async verifyOTP(email: string, otp: string) {
    const cleanEmail = email.trim().toLowerCase()
    const cleanOtp = otp.trim()

    const savedOtp = await kv.get(`otp:forgot-password:${cleanEmail}`)
    if (!savedOtp || String(savedOtp).trim() !== cleanOtp) {
      throw new Error('Mã OTP không đúng hoặc đã hết hạn.')
    }

    const resetToken = await signJwt(
      { email: cleanEmail, role: 'reset-password' },
      getJwtSecret(),
      { expiresIn: '10m' },
    )

    await kv.del(`otp:forgot-password:${cleanEmail}`)
    return { resetToken }
  },

  async resetPassword(resetToken: string, newPassword: string) {
    if (!resetToken || !newPassword) {
      throw new Error('Thiếu thông tin khôi phục mật khẩu.')
    }
    if (newPassword.length < 6) {
      throw new Error('Mật khẩu mới phải chứa ít nhất 6 ký tự.')
    }

    const decoded: any = await verifyJwt(resetToken, getJwtSecret())
    if (decoded.role !== 'reset-password') {
      throw new Error('Vai trò của mã khôi phục không hợp lệ.')
    }

    const email = decoded.email
    const users = await db.select()
      .from(schema.users)
      .where(and(eq(schema.users.email, email), eq(schema.users.deleted, 0)))
      .limit(1)

    const user = users[0]
    if (!user) {
      throw new Error('Tài khoản người dùng không tồn tại.')
    }

    await db.update(schema.users)
      .set({
        password: hashPassword(newPassword),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.users.id, user.id))

    return { success: true }
  },
}
