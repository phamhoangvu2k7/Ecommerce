import { hubDatabase } from '../utils/models.ts'

export const schema = `
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      permissions TEXT DEFAULT '[]',
      deleted INTEGER DEFAULT 0,
      deletedAt TEXT DEFAULT NULL,
      deletedBy TEXT DEFAULT NULL,
      createdBy TEXT DEFAULT NULL,
      updatedBy TEXT DEFAULT NULL,
      createdAt TEXT DEFAULT (datetime('now', 'localtime')),
      updatedAt TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      fullName TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role_id TEXT DEFAULT NULL,
      phone TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      status TEXT DEFAULT 'active',
      deleted INTEGER DEFAULT 0,
      deletedAt TEXT DEFAULT NULL,
      deletedBy TEXT DEFAULT NULL,
      createdBy TEXT DEFAULT NULL,
      updatedBy TEXT DEFAULT NULL,
      createdAt TEXT DEFAULT (datetime('now', 'localtime')),
      updatedAt TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      fullName TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      phone TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      status TEXT DEFAULT 'active',
      deleted INTEGER DEFAULT 0,
      deletedAt TEXT DEFAULT NULL,
      deletedBy TEXT DEFAULT NULL,
      createdBy TEXT DEFAULT NULL,
      updatedBy TEXT DEFAULT NULL,
      createdAt TEXT DEFAULT (datetime('now', 'localtime')),
      updatedAt TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS product_categories (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      parent_id TEXT DEFAULT NULL,
      slug TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'active',
      position INTEGER DEFAULT 0,
      deleted INTEGER DEFAULT 0,
      deletedAt TEXT DEFAULT NULL,
      deletedBy TEXT DEFAULT NULL,
      createdBy TEXT DEFAULT NULL,
      updatedBy TEXT DEFAULT NULL,
      createdAt TEXT DEFAULT (datetime('now', 'localtime')),
      updatedAt TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL,
      product_category_id TEXT DEFAULT NULL,
      description TEXT DEFAULT '',
      price REAL DEFAULT 0,
      discountPercentage REAL DEFAULT 0,
      stock INTEGER DEFAULT 0,
      thumbnail TEXT DEFAULT '',
      status TEXT DEFAULT 'active',
      position INTEGER DEFAULT 0,
      deleted INTEGER DEFAULT 0,
      deletedAt TEXT DEFAULT NULL,
      deletedBy TEXT DEFAULT NULL,
      createdBy TEXT DEFAULT NULL,
      updatedBy TEXT DEFAULT NULL,
      createdAt TEXT DEFAULT (datetime('now', 'localtime')),
      updatedAt TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS carts (
      id TEXT PRIMARY KEY,
      user_id TEXT DEFAULT NULL,
      products TEXT DEFAULT '[]',
      createdAt TEXT DEFAULT (datetime('now', 'localtime')),
      updatedAt TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT DEFAULT NULL,
      cart_id TEXT NOT NULL,
      userInfo TEXT NOT NULL,
      products TEXT DEFAULT '[]',
      status TEXT DEFAULT 'pending',
      deleted INTEGER DEFAULT 0,
      deletedAt TEXT DEFAULT NULL,
      deletedBy TEXT DEFAULT NULL,
      createdBy TEXT DEFAULT NULL,
      updatedBy TEXT DEFAULT NULL,
      createdAt TEXT DEFAULT (datetime('now', 'localtime')),
      updatedAt TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS forgot_passwords (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      otp TEXT NOT NULL,
      expireAt TEXT NOT NULL,
      createdAt TEXT DEFAULT (datetime('now', 'localtime')),
      updatedAt TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT DEFAULT '',
      timestamp TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `

export default defineNitroPlugin(async (nitroApp) => {
  const db = hubDatabase()

  console.log('[NuxtHub D1] Initializing SQLite database tables...')

  try {
    await db.exec(schema)
    console.log('[NuxtHub D1] Database tables initialized successfully.')
  }
  catch (err) {
    console.error('[NuxtHub D1] Error initializing database tables:', err)
  }
})
