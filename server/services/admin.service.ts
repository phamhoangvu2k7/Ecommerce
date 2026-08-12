import { and, count, eq, ne } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { comparePassword, getJwtSecret } from '../utils/helpers'
import { signAccessToken, signRefreshToken } from '../utils/jwt'

export const AdminService = {
  async login(email: string, password: string) {
    const accounts = await db.select()
      .from(schema.accounts)
      .where(and(eq(schema.accounts.email, email), eq(schema.accounts.deleted, 0)))
      .limit(1)

    const account = accounts[0]
    const isValidPassword = account ? await comparePassword(password, account.password) : false
    if (!account || !isValidPassword) {
      throw new Error('Email hoặc mật khẩu không chính xác.')
    }

    if (account.status !== 'active') {
      throw new Error('Tài khoản của bạn đã bị khóa.')
    }

    let role: any = null
    if (account.role_id) {
      const roles = await db.select()
        .from(schema.roles)
        .where(and(eq(schema.roles.id, account.role_id), eq(schema.roles.deleted, 0)))
        .limit(1)
      role = roles[0] || null
      if (role && typeof role.permissions === 'string') {
        try {
          role.permissions = JSON.parse(role.permissions)
        }
        catch {
          role.permissions = []
        }
      }
    }

    const permissions = role?.permissions || []
    const secret = getJwtSecret()
    const token = await signAccessToken({
      id: account.id,
      role: 'admin',
      fullName: account.fullName,
      email: account.email,
      phone: account.phone || '',
      avatar: account.avatar || '',
      permissions,
    }, secret)
    const refreshToken = await signRefreshToken({ id: account.id, role: 'admin' }, secret)

    const refreshTokenId = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    await db.insert(schema.refreshTokens).values({
      id: refreshTokenId,
      account_id: account.id,
      token: refreshToken,
      expiresAt,
      isRevoked: 0,
    })

    return {
      user: {
        id: account.id,
        fullName: account.fullName,
        email: account.email,
        phone: account.phone,
        avatar: account.avatar,
        role,
      },
      token,
      refreshToken,
    }
  },

  async getDashboardStats() {
    const [
      productsActiveCount,
      productsInactiveCount,
      categoriesCount,
      usersCount,
      ordersCount,
      activeOrders,
    ] = await Promise.all([
      db.select({ value: count() }).from(schema.products).where(and(eq(schema.products.status, 'active'), eq(schema.products.deleted, 0))),
      db.select({ value: count() }).from(schema.products).where(and(eq(schema.products.status, 'inactive'), eq(schema.products.deleted, 0))),
      db.select({ value: count() }).from(schema.productCategories).where(eq(schema.productCategories.deleted, 0)),
      db.select({ value: count() }).from(schema.users).where(eq(schema.users.deleted, 0)),
      db.select({ value: count() }).from(schema.orders).where(eq(schema.orders.deleted, 0)),
      db.select().from(schema.orders).where(and(ne(schema.orders.status, 'cancelled'), eq(schema.orders.deleted, 0))),
    ])

    const totalProductsActive = productsActiveCount[0]?.value || 0
    const totalProductsInactive = productsInactiveCount[0]?.value || 0
    const totalCategories = categoriesCount[0]?.value || 0
    const totalUsers = usersCount[0]?.value || 0
    const totalOrders = ordersCount[0]?.value || 0

    let totalRevenue = 0
    for (const order of activeOrders) {
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

      for (const item of orderProducts) {
        const price = Number(item.price) || 0
        const discount = Number(item.discountPercentage) || 0
        const quantity = Number(item.quantity) || 0
        const priceAfterDiscount = price * (1 - discount / 100)
        totalRevenue += priceAfterDiscount * quantity
      }
    }

    return {
      products: {
        active: totalProductsActive,
        inactive: totalProductsInactive,
        total: totalProductsActive + totalProductsInactive,
      },
      categoriesCount: totalCategories,
      usersCount: totalUsers,
      orders: {
        total: totalOrders,
        revenue: Math.round(totalRevenue),
      },
    }
  },

  async getTrashItems() {
    const [deletedProducts, deletedCategories] = await Promise.all([
      db.select().from(schema.products).where(eq(schema.products.deleted, 1)),
      db.select().from(schema.productCategories).where(eq(schema.productCategories.deleted, 1)),
    ])

    return {
      products: deletedProducts,
      categories: deletedCategories,
    }
  },
}
