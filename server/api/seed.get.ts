import { createError, defineEventHandler, getQuery } from 'h3'
import { db, schema } from 'hub:db'
import * as helpers from '../utils/helpers'

export default defineEventHandler(async (event) => {
  // 1. Kiểm tra bảo mật khi chạy ở môi trường Production
  // eslint-disable-next-line node/prefer-global/process
  if (process.env.NODE_ENV === 'production') {
    const query = getQuery(event)
    // eslint-disable-next-line node/prefer-global/process
    const seedSecret = process.env.SEED_SECRET

    // Nếu không cấu hình SEED_SECRET hoặc token truyền vào không khớp
    if (!seedSecret || query.secret !== seedSecret) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Bạn không có quyền chạy lệnh seed này trên môi trường Production!',
      })
    }
  }

  try {
    await db.delete(schema.roles)
    await db.delete(schema.accounts)
    await db.delete(schema.productCategories)
    await db.delete(schema.products)

    const adminPermissions = [
      'products_view',
      'products_create',
      'products_edit',
      'products_delete',
      'categories_view',
      'categories_create',
      'categories_edit',
      'categories_delete',
      'accounts_view',
      'accounts_create',
      'accounts_edit',
      'accounts_delete',
      'roles_view',
      'roles_create',
      'roles_edit',
      'roles_delete',
      'orders_view',
      'orders_edit',
    ]

    await db.insert(schema.roles).values({
      id: 'role-admin',
      title: 'Quản trị viên',
      description: 'Toàn quyền quản trị hệ thống',
      permissions: JSON.stringify(adminPermissions) as any,
    })

    // Sử dụng biến môi trường (Environment Variables) hoặc fallback về mặc định
    // eslint-disable-next-line node/prefer-global/process
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
    // eslint-disable-next-line node/prefer-global/process
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

    await db.insert(schema.accounts).values({
      id: 'account-admin',
      fullName: 'Super Admin',
      email: adminEmail,
      password: helpers.hashPassword(adminPassword),
      role_id: 'role-admin',
      phone: '0123456789',
      avatar: '',
      status: 'active',
    })

    await db.insert(schema.productCategories).values({
      id: 'cat-1',
      title: 'Điện thoại',
      slug: 'dien-thoai',
      description: 'Các sản phẩm điện thoại di động thông minh',
      status: 'active',
      position: 1,
    })

    await db.insert(schema.productCategories).values({
      id: 'cat-2',
      title: 'Laptop',
      slug: 'laptop',
      description: 'Các dòng máy tính xách tay cao cấp',
      status: 'active',
      position: 2,
    })

    await db.insert(schema.products).values({
      id: 'prod-1',
      title: 'iPhone 15 Pro Max 256GB',
      slug: 'iphone-15-pro-max-256gb',
      product_category_id: 'cat-1',
      description: 'Điện thoại Apple cao cấp nhất năm 2023',
      price: 30000000,
      discountPercentage: 10,
      stock: 50,
      thumbnail: '',
      status: 'active',
      position: 1,
    })

    await db.insert(schema.products).values({
      id: 'prod-2',
      title: 'MacBook Air M3 8GB 256GB',
      slug: 'macbook-air-m3-8gb-256gb',
      product_category_id: 'cat-2',
      description: 'Laptop Apple siêu mỏng nhẹ chip M3 mới nhất',
      price: 28000000,
      discountPercentage: 5,
      stock: 30,
      thumbnail: '',
      status: 'active',
      position: 2,
    })

    await db.insert(schema.products).values({
      id: 'prod-3',
      title: 'Samsung Galaxy S24 Ultra',
      slug: 'samsung-galaxy-s24-ultra',
      product_category_id: 'cat-1',
      description: 'Flagship cao cấp nhất của Samsung với AI thông minh',
      price: 25000000,
      discountPercentage: 8,
      stock: 45,
      thumbnail: '',
      status: 'active',
      position: 3,
    })

    return {
      success: true,
      message: 'Khởi tạo dữ liệu mẫu SQLite (D1) thành công!',
      data: {
        adminEmail,
        adminPassword,
      },
    }
  }
  catch (err: any) {
    console.error('[Seeding] Error seeding database:', err)
    return {
      success: false,
      message: `Khởi tạo dữ liệu mẫu thất bại: ${err.message}`,
    }
  }
})
