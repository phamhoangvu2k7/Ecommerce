import { defineEventHandler } from 'h3'
import { hashPassword } from '../utils/helpers.ts'
import { Account, Product, ProductCategory, Role } from '../utils/models.ts'

export default defineEventHandler(async (event) => {
  try {
    console.log('[Seeding] Deleting old records...')
    await Role.deleteMany({})
    await Account.deleteMany({})
    await ProductCategory.deleteMany({})
    await Product.deleteMany({})

    console.log('[Seeding] Inserting Roles...')
    const adminRole = new Role({
      id: 'role-admin',
      title: 'Quản trị viên',
      description: 'Toàn quyền quản trị hệ thống',
      permissions: [
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
      ],
    })
    await adminRole.save()

    console.log('[Seeding] Inserting Admin Account...')
    const adminAccount = new Account({
      id: 'account-admin',
      fullName: 'Super Admin',
      email: 'admin@example.com',
      password: hashPassword('admin123'),
      role_id: 'role-admin',
      phone: '0123456789',
      avatar: '',
      status: 'active',
    })
    await adminAccount.save()

    console.log('[Seeding] Inserting Categories...')
    const cat1 = new ProductCategory({
      id: 'cat-1',
      title: 'Điện thoại',
      slug: 'dien-thoai',
      description: 'Các sản phẩm điện thoại di động thông minh',
      status: 'active',
      position: 1,
    })
    const cat2 = new ProductCategory({
      id: 'cat-2',
      title: 'Laptop',
      slug: 'laptop',
      description: 'Các dòng máy tính xách tay cao cấp',
      status: 'active',
      position: 2,
    })
    await cat1.save()
    await cat2.save()

    console.log('[Seeding] Inserting Products...')
    const p1 = new Product({
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

    const p2 = new Product({
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

    const p3 = new Product({
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

    await p1.save()
    await p2.save()
    await p3.save()

    console.log('[Seeding] Seeding completed successfully.')
    return {
      success: true,
      message: 'Khởi tạo dữ liệu mẫu SQLite (D1) thành công!',
      data: {
        adminEmail: 'admin@example.com',
        adminPassword: 'admin123',
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
