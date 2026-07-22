import { sql } from 'drizzle-orm'
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// TypeScript Interfaces for JSON fields
export interface CartProduct {
  product_id: string
  quantity: number
}

export interface OrderProduct {
  product_id: string
  price: number
  discountPercentage: number
  quantity: number
}

export interface OrderUserInfo {
  fullName: string
  phone: string
  address: string
  email?: string
}

// 1. Roles
export const roles = sqliteTable('roles', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').default(''),
  permissions: text('permissions').$type<string[]>().default([]),
  deleted: integer('deleted').default(0),
  deletedAt: text('deletedAt'),
  deletedBy: text('deletedBy'),
  createdBy: text('createdBy'),
  updatedBy: text('updatedBy'),
  createdAt: text('createdAt').default(sql`(datetime('now', 'localtime'))`),
  updatedAt: text('updatedAt').default(sql`(datetime('now', 'localtime'))`),
})

// 2. Accounts
export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  fullName: text('fullName').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role_id: text('role_id'),
  phone: text('phone').default(''),
  avatar: text('avatar').default(''),
  status: text('status').default('active'),
  deleted: integer('deleted').default(0),
  deletedAt: text('deletedAt'),
  deletedBy: text('deletedBy'),
  createdBy: text('createdBy'),
  updatedBy: text('updatedBy'),
  createdAt: text('createdAt').default(sql`(datetime('now', 'localtime'))`),
  updatedAt: text('updatedAt').default(sql`(datetime('now', 'localtime'))`),
})

// 3. Users
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  fullName: text('fullName').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  phone: text('phone').default(''),
  avatar: text('avatar').default(''),
  status: text('status').default('active'),
  deleted: integer('deleted').default(0),
  deletedAt: text('deletedAt'),
  deletedBy: text('deletedBy'),
  createdBy: text('createdBy'),
  updatedBy: text('updatedBy'),
  createdAt: text('createdAt').default(sql`(datetime('now', 'localtime'))`),
  updatedAt: text('updatedAt').default(sql`(datetime('now', 'localtime'))`),
})

// 4. Product Categories
export const productCategories = sqliteTable('product_categories', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  parent_id: text('parent_id'),
  slug: text('slug').notNull(),
  description: text('description').default(''),
  status: text('status').default('active'),
  position: integer('position').default(0),
  deleted: integer('deleted').default(0),
  deletedAt: text('deletedAt'),
  deletedBy: text('deletedBy'),
  createdBy: text('createdBy'),
  updatedBy: text('updatedBy'),
  createdAt: text('createdAt').default(sql`(datetime('now', 'localtime'))`),
  updatedAt: text('updatedAt').default(sql`(datetime('now', 'localtime'))`),
})

// 5. Products
export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  product_category_id: text('product_category_id'),
  description: text('description').default(''),
  price: real('price').default(0),
  discountPercentage: real('discountPercentage').default(0),
  stock: integer('stock').default(0),
  thumbnail: text('thumbnail').default(''),
  status: text('status').default('active'),
  position: integer('position').default(0),
  deleted: integer('deleted').default(0),
  deletedAt: text('deletedAt'),
  deletedBy: text('deletedBy'),
  createdBy: text('createdBy'),
  updatedBy: text('updatedBy'),
  createdAt: text('createdAt').default(sql`(datetime('now', 'localtime'))`),
  updatedAt: text('updatedAt').default(sql`(datetime('now', 'localtime'))`),
})

// 6. Carts
export const carts = sqliteTable('carts', {
  id: text('id').primaryKey(),
  user_id: text('user_id'),
  products: text('products').$type<CartProduct[]>().default([]),
  createdAt: text('createdAt').default(sql`(datetime('now', 'localtime'))`),
  updatedAt: text('updatedAt').default(sql`(datetime('now', 'localtime'))`),
})

// 7. Orders
export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  user_id: text('user_id'),
  cart_id: text('cart_id').notNull(),
  userInfo: text('userInfo').$type<OrderUserInfo>().notNull(),
  products: text('products').$type<OrderProduct[]>().default([]),
  status: text('status').default('pending'),
  deleted: integer('deleted').default(0),
  deletedAt: text('deletedAt'),
  deletedBy: text('deletedBy'),
  createdBy: text('createdBy'),
  updatedBy: text('updatedBy'),
  createdAt: text('createdAt').default(sql`(datetime('now', 'localtime'))`),
  updatedAt: text('updatedAt').default(sql`(datetime('now', 'localtime'))`),
})
