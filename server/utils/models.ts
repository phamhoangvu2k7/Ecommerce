import { sql } from 'drizzle-orm'
import { db } from 'hub:db'
import { randomUUID } from 'uncrypto'
import { prependImageDomain, stripImageDomain } from '~/server/utils/helpers.ts'

// --- 0. Custom hubDatabase Wrapper based on Drizzle ORM for raw SQL ---
export function hubDatabase() {
  return {
    async exec(queryString: string) {
      await db.run(sql.raw(queryString))
    },
    prepare(queryString: string) {
      let boundParams: any[] = []
      return {
        bind(...params: any[]) {
          boundParams = params
          return this
        },
        async run() {
          const chunks = queryString.split('?')
          const sqlQuery = sql(chunks as any, ...boundParams)
          await db.run(sqlQuery)
          return { success: true }
        },
        async all() {
          const chunks = queryString.split('?')
          const sqlQuery = sql(chunks as any, ...boundParams)
          const rows = await db.all<any>(sqlQuery)
          return { results: rows }
        },
        async first() {
          const chunks = queryString.split('?')
          const sqlQuery = sql(chunks as any, ...boundParams)
          const row = await db.get<any>(sqlQuery)
          return row || null
        },
      }
    },
  }
}

// --- 1. Query Builder for SQLite D1 ---
class QueryBuilder<T extends BaseModel> {
  modelClass: any
  filter: any
  _sort: any = null
  _limit: number | null = null
  _skip: number | null = null
  _populatePaths: string[] = []
  _lean: boolean = false

  constructor(modelClass: any, filter: any = {}) {
    this.modelClass = modelClass
    this.filter = { ...filter }
  }

  sort(sortObj: any) {
    this._sort = sortObj
    return this
  }

  limit(limitVal: number) {
    this._limit = limitVal
    return this
  }

  skip(skipVal: number) {
    this._skip = skipVal
    return this
  }

  populate(path: string) {
    this._populatePaths.push(path)
    return this
  }

  lean() {
    this._lean = true
    return this
  }

  buildWhere() {
    const whereParts: string[] = []
    const params: any[] = []

    // Apply soft delete filter by default if model supports it
    if (this.modelClass.hasSoftDelete && this.filter.deleted === undefined) {
      whereParts.push('deleted = 0')
    }

    for (const [key, val] of Object.entries(this.filter)) {
      const col = key === '_id' ? 'id' : key

      if (!this.modelClass.columns.includes(col)) {
        continue
      }

      if (val === null) {
        whereParts.push(`${col} IS NULL`)
      }
      else if (val instanceof RegExp) {
        whereParts.push(`${col} LIKE ?`)
        params.push(`%${val.source}%`)
      }
      else if (typeof val === 'object' && val !== null) {
        // MongoDB operators
        if ('$in' in val) {
          const inArr = (val as any).$in
          if (!Array.isArray(inArr) || inArr.length === 0) {
            whereParts.push('1 = 0') // Empty array means match nothing
          }
          else {
            const placeholders = inArr.map(() => '?').join(', ')
            whereParts.push(`${col} IN (${placeholders})`)
            params.push(...inArr)
          }
        }
        if ('$gte' in val) {
          whereParts.push(`${col} >= ?`)
          params.push((val as any).$gte)
        }
        if ('$lte' in val) {
          whereParts.push(`${col} <= ?`)
          params.push((val as any).$lte)
        }
        if ('$gt' in val) {
          whereParts.push(`${col} > ?`)
          params.push((val as any).$gt)
        }
        if ('$lt' in val) {
          whereParts.push(`${col} < ?`)
          params.push((val as any).$lt)
        }
        if ('$ne' in val) {
          whereParts.push(`${col} != ?`)
          params.push((val as any).$ne)
        }
      }
      else {
        // Direct value
        whereParts.push(`${col} = ?`)
        if (typeof val === 'boolean') {
          params.push(val ? 1 : 0)
        }
        else {
          params.push(val)
        }
      }
    }

    return {
      whereClause: whereParts.length > 0 ? whereParts.join(' AND ') : '',
      params,
    }
  }

  async count(): Promise<number> {
    const { whereClause, params } = this.buildWhere()
    let sqlQuery = `SELECT COUNT(*) as count FROM ${this.modelClass.tableName}`
    if (whereClause) {
      sqlQuery += ` WHERE ${whereClause}`
    }
    const stmt = this.modelClass.db.prepare(sqlQuery).bind(...params)
    const row = await stmt.first()
    return row ? (row.count as number) : 0
  }

  async execute(): Promise<any[]> {
    const { whereClause, params } = this.buildWhere()
    let sqlQuery = `SELECT * FROM ${this.modelClass.tableName}`

    if (whereClause) {
      sqlQuery += ` WHERE ${whereClause}`
    }

    if (this._sort) {
      const sortParts = Object.entries(this._sort).map(([field, order]) => {
        const sqlField = field === '_id' ? 'id' : field
        const dir = String(order).toLowerCase().startsWith('desc') || order === -1 ? 'DESC' : 'ASC'
        return `${sqlField} ${dir}`
      })
      if (sortParts.length > 0) {
        sqlQuery += ` ORDER BY ${sortParts.join(', ')}`
      }
    }

    if (this._limit !== null) {
      sqlQuery += ` LIMIT ${Number(this._limit)}`
    }
    if (this._skip !== null) {
      sqlQuery += ` OFFSET ${Number(this._skip)}`
    }

    const stmt = this.modelClass.db.prepare(sqlQuery).bind(...params)
    const { results } = await stmt.all()

    // Map raw rows to model instances / objects
    let rows = results.map((row: any) => this.modelClass.fromRow(row))

    // Handle populate paths
    if (this._populatePaths.length > 0 && rows.length > 0) {
      for (const path of this._populatePaths) {
        if (path === 'product_category_id') {
          const categoryIds = [...new Set(rows.map(r => r.product_category_id).filter(Boolean))]
          if (categoryIds.length > 0) {
            const placeholders = categoryIds.map(() => '?').join(', ')
            const catRows = await this.modelClass.db
              .prepare(`SELECT * FROM product_categories WHERE id IN (${placeholders})`)
              .bind(...categoryIds)
              .all()
            const catMap = Object.fromEntries(
              catRows.results.map((c: any) => [c.id, ProductCategory.fromRow(c)]),
            )
            rows.forEach((r) => {
              r.product_category_id = catMap[r.product_category_id] || null
            })
          }
        }
        else if (path === 'role_id') {
          const roleIds = [...new Set(rows.map(r => r.role_id).filter(Boolean))]
          if (roleIds.length > 0) {
            const placeholders = roleIds.map(() => '?').join(', ')
            const roleRows = await this.modelClass.db
              .prepare(`SELECT * FROM roles WHERE id IN (${placeholders})`)
              .bind(...roleIds)
              .all()
            const roleMap = Object.fromEntries(
              roleRows.results.map((role: any) => [role.id, Role.fromRow(role)]),
            )
            rows.forEach((r) => {
              r.role_id = roleMap[r.role_id] || null
            })
          }
        }
        else if (path === 'products.product_id') {
          // Flatten all product IDs in cart or order items
          const productIds = [
            ...new Set(
              rows.flatMap(r => (r.products || []).map((p: any) => p.product_id)).filter(Boolean),
            ),
          ]
          if (productIds.length > 0) {
            const placeholders = productIds.map(() => '?').join(', ')
            const prodRows = await this.modelClass.db
              .prepare(`SELECT * FROM products WHERE id IN (${placeholders})`)
              .bind(...productIds)
              .all()
            const prodMap = Object.fromEntries(
              prodRows.results.map((p: any) => [p.id, Product.fromRow(p)]),
            )
            rows.forEach((r) => {
              if (Array.isArray(r.products)) {
                r.products.forEach((p: any) => {
                  p.product_id = prodMap[p.product_id] || null
                })
              }
            })
          }
        }
      }
    }

    if (this._lean) {
      return rows.map(r => r.toObject())
    }
    return rows
  }

  // Promise thenable
  async then(onfulfilled?: (value: T[]) => any, onrejected?: (reason: any) => any) {
    try {
      const results = await this.execute()
      if (onfulfilled)
        return onfulfilled(results)
      return results
    }
    catch (err) {
      if (onrejected)
        return onrejected(err)
      throw err
    }
  }
}

// --- 2. Base Model Class ---
export class BaseModel {
  static tableName: string = ''
  static columns: string[] = []
  static jsonFields: string[] = []
  static hasSoftDelete: boolean = false

  id!: string
  createdAt!: string
  updatedAt!: string

  // Soft delete fields (optional, added dynamically)
  deleted?: number
  deletedAt?: string | null
  deletedBy?: string | null
  createdBy?: string | null
  updatedBy?: string | null

  constructor(data: any = {}) {
    this.id = data.id || data._id || randomUUID()

    // Assign fields
    const cls = this.constructor as typeof BaseModel
    cls.columns.forEach((col) => {
      if (col === 'id')
        return
      if (data[col] !== undefined) {
        (this as any)[col] = data[col]
      }
      else {
        (this as any)[col] = null
      }
    })

    if (cls.hasSoftDelete) {
      this.deleted = data.deleted !== undefined ? (data.deleted ? 1 : 0) : 0
      this.deletedAt = data.deletedAt || null
      this.deletedBy = data.deletedBy || null
      this.createdBy = data.createdBy || null
      this.updatedBy = data.updatedBy || null
    }

    this.createdAt = data.createdAt || new Date().toISOString()
    this.updatedAt = data.updatedAt || new Date().toISOString()
  }

  static get db() {
    return hubDatabase()
  }

  static find(filter: any = {}) {
    return new QueryBuilder(this, filter)
  }

  static findOne(filter: any = {}) {
    const qb = new QueryBuilder(this, filter)
    qb.limit(1)
    const modelClass = this

    return {
      sort(sortObj: any) {
        qb.sort(sortObj)
        return this
      },
      populate(path: string) {
        qb.populate(path)
        return this
      },
      lean() {
        qb.lean()
        return this
      },
      async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
        try {
          const results = await qb.execute()
          const result = results.length > 0 ? results[0] : null
          if (onfulfilled)
            return onfulfilled(result)
          return result
        }
        catch (err) {
          if (onrejected)
            return onrejected(err)
          throw err
        }
      },
    } as any
  }

  static findById(id: string) {
    return this.findOne({ _id: id })
  }

  static async countDocuments(filter: any = {}): Promise<number> {
    const qb = new QueryBuilder(this, filter)
    return qb.count()
  }

  static fromRow(row: any) {
    if (!row)
      return null
    const data = { ...row }
    const cls = this

    // Parse JSON fields
    cls.jsonFields.forEach((field) => {
      if (typeof data[field] === 'string') {
        try {
          data[field] = JSON.parse(data[field])
        }
        catch {
          data[field] = field === 'userInfo' ? {} : []
        }
      }
    })

    return new cls(data)
  }

  static async updateOne(filter: any, update: any) {
    const qb = new QueryBuilder(this, filter)
    const { whereClause, params: whereParams } = qb.buildWhere()

    const setParts: string[] = []
    const updateParams: any[] = []

    const addSet = (col: string, val: any, isInc = false) => {
      const cls = this
      if (!cls.columns.includes(col))
        return

      if (isInc) {
        setParts.push(`${col} = ${col} + ?`)
      }
      else {
        setParts.push(`${col} = ?`)
      }

      if (cls.jsonFields.includes(col)) {
        updateParams.push(JSON.stringify(val))
      }
      else if (val instanceof Date) {
        updateParams.push(val.toISOString())
      }
      else if (typeof val === 'boolean') {
        updateParams.push(val ? 1 : 0)
      }
      else {
        updateParams.push(val)
      }
    }

    if (update.$set) {
      for (const [col, val] of Object.entries(update.$set)) {
        addSet(col, val)
      }
    }
    if (update.$inc) {
      for (const [col, val] of Object.entries(update.$inc)) {
        addSet(col, val, true)
      }
    }

    for (const [col, val] of Object.entries(update)) {
      if (col.startsWith('$'))
        continue
      addSet(col, val)
    }

    if (setParts.length === 0)
      return

    let sqlQuery = `UPDATE ${this.tableName} SET ${setParts.join(', ')}`
    if (whereClause) {
      sqlQuery += ` WHERE ${whereClause}`
    }

    const allParams = [...updateParams, ...whereParams]
    await this.db.prepare(sqlQuery).bind(...allParams).run()
  }

  static async findOneAndUpdate(filter: any, update: any, options: any = {}) {
    const modelClass = this
    return {
      async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
        try {
          const row = await modelClass.findOne(filter)
          if (!row) {
            if (onfulfilled)
              return onfulfilled(null)
            return null
          }
          await modelClass.updateOne({ _id: row.id }, update)
          const updated = await modelClass.findOne({ _id: row.id })
          if (onfulfilled)
            return onfulfilled(updated)
          return updated
        }
        catch (err) {
          if (onrejected)
            return onrejected(err)
          throw err
        }
      },
    } as any
  }

  static async deleteMany(filter: any = {}) {
    const qb = new QueryBuilder(this, filter)
    const { whereClause, params } = qb.buildWhere()
    let sqlQuery = `DELETE FROM ${this.tableName}`
    if (whereClause) {
      sqlQuery += ` WHERE ${whereClause}`
    }
    await this.db.prepare(sqlQuery).bind(...params).run()
  }

  async save() {
    const cls = this.constructor as typeof BaseModel
    const db = cls.db

    this.updatedAt = new Date().toISOString()

    const cols = cls.columns
    const placeholders = cols.map(() => '?').join(', ')
    const sqlQuery = `INSERT OR REPLACE INTO ${cls.tableName} (${cols.join(', ')}) VALUES (${placeholders})`

    const params = cols.map((col) => {
      let val = col === 'thumbnail' ? (this as any)._thumbnail : (this as any)[col]
      if (val === undefined) {
        val = null
      }
      if (cls.jsonFields.includes(col)) {
        return JSON.stringify(val || (col === 'userInfo' ? {} : []))
      }
      if (val instanceof Date) {
        return val.toISOString()
      }
      if (typeof val === 'boolean') {
        return val ? 1 : 0
      }
      return val
    })

    await db.prepare(sqlQuery).bind(...params).run()
    return this
  }

  toObject() {
    const cls = this.constructor as typeof BaseModel
    const obj: any = {}
    cls.columns.forEach((col) => {
      let val = (this as any)[col]
      if (col === 'deleted') {
        obj[col] = !!val
      }
      else {
        obj[col] = val
      }
    })
    obj._id = this.id
    return obj
  }

  toJSON() {
    return this.toObject()
  }

  get _id() {
    return this.id
  }
}

// --- 3. Concrete Models ---

export class Role extends BaseModel {
  static tableName = 'roles'
  static columns = [
    'id',
    'title',
    'description',
    'permissions',
    'deleted',
    'deletedAt',
    'deletedBy',
    'createdBy',
    'updatedBy',
    'createdAt',
    'updatedAt',
  ]

  static jsonFields = ['permissions']
  static hasSoftDelete = true

  title!: string
  description!: string
  permissions!: string[]

  constructor(data: any = {}) {
    super(data)
    this.title = data.title || ''
    this.description = data.description || ''
    this.permissions = data.permissions || []
  }
}

export class Account extends BaseModel {
  static tableName = 'accounts'
  static columns = [
    'id',
    'fullName',
    'email',
    'password',
    'role_id',
    'phone',
    'avatar',
    'status',
    'deleted',
    'deletedAt',
    'deletedBy',
    'createdBy',
    'updatedBy',
    'createdAt',
    'updatedAt',
  ]

  static jsonFields: string[] = []
  static hasSoftDelete = true

  fullName!: string
  email!: string
  password!: string
  role_id!: any
  phone!: string
  avatar!: string
  status!: string

  constructor(data: any = {}) {
    super(data)
    this.fullName = data.fullName || ''
    this.email = data.email || ''
    this.password = data.password || ''
    this.role_id = data.role_id || null
    this.phone = data.phone || ''
    this.avatar = data.avatar || ''
    this.status = data.status || 'active'
  }
}

export class User extends BaseModel {
  static tableName = 'users'
  static columns = [
    'id',
    'fullName',
    'email',
    'password',
    'phone',
    'avatar',
    'status',
    'deleted',
    'deletedAt',
    'deletedBy',
    'createdBy',
    'updatedBy',
    'createdAt',
    'updatedAt',
  ]

  static jsonFields: string[] = []
  static hasSoftDelete = true

  fullName!: string
  email!: string
  password!: string
  phone!: string
  avatar!: string
  status!: string

  constructor(data: any = {}) {
    super(data)
    this.fullName = data.fullName || ''
    this.email = data.email || ''
    this.password = data.password || ''
    this.phone = data.phone || ''
    this.avatar = data.avatar || ''
    this.status = data.status || 'active'
  }
}

export class ProductCategory extends BaseModel {
  static tableName = 'product_categories'
  static columns = [
    'id',
    'title',
    'parent_id',
    'slug',
    'description',
    'status',
    'position',
    'deleted',
    'deletedAt',
    'deletedBy',
    'createdBy',
    'updatedBy',
    'createdAt',
    'updatedAt',
  ]

  static jsonFields: string[] = []
  static hasSoftDelete = true

  title!: string
  parent_id!: any
  slug!: string
  description!: string
  status!: string
  position!: number

  constructor(data: any = {}) {
    super(data)
    this.title = data.title || ''
    this.parent_id = data.parent_id || null
    this.slug = data.slug || ''
    this.description = data.description || ''
    this.status = data.status || 'active'
    this.position = data.position || 0
  }
}

export class Product extends BaseModel {
  static tableName = 'products'
  static columns = [
    'id',
    'title',
    'slug',
    'product_category_id',
    'description',
    'price',
    'discountPercentage',
    'stock',
    'thumbnail',
    'status',
    'position',
    'deleted',
    'deletedAt',
    'deletedBy',
    'createdBy',
    'updatedBy',
    'createdAt',
    'updatedAt',
  ]

  static jsonFields: string[] = []
  static hasSoftDelete = true

  title!: string
  slug!: string
  product_category_id!: any
  description!: string
  price!: number
  discountPercentage!: number
  stock!: number
  _thumbnail: string = ''
  status!: string
  position!: number

  constructor(data: any = {}) {
    super(data)
    this.title = data.title || ''
    this.slug = data.slug || ''
    this.product_category_id = data.product_category_id || null
    this.description = data.description || ''
    this.price = data.price || 0
    this.discountPercentage = data.discountPercentage || 0
    this.stock = data.stock || 0
    this.status = data.status || 'active'
    this.position = data.position || 0

    if (data.thumbnail !== undefined) {
      this.thumbnail = data.thumbnail
    }
  }

  get thumbnail() {
    return prependImageDomain(this._thumbnail)
  }

  set thumbnail(val: string) {
    this._thumbnail = stripImageDomain(val)
  }

  toObject() {
    const obj = super.toObject()
    obj.thumbnail = this.thumbnail
    return obj
  }
}

export class Cart extends BaseModel {
  static tableName = 'carts'
  static columns = ['id', 'user_id', 'products', 'createdAt', 'updatedAt']
  static jsonFields = ['products']
  static hasSoftDelete = false

  user_id!: any
  products!: Array<{ product_id: any, quantity: number }>

  constructor(data: any = {}) {
    super(data)
    this.user_id = data.user_id || null
    this.products = data.products || []
  }
}

export class Order extends BaseModel {
  static tableName = 'orders'
  static columns = [
    'id',
    'user_id',
    'cart_id',
    'userInfo',
    'products',
    'status',
    'deleted',
    'deletedAt',
    'deletedBy',
    'createdBy',
    'updatedBy',
    'createdAt',
    'updatedAt',
  ]

  static jsonFields = ['userInfo', 'products']
  static hasSoftDelete = true

  user_id!: any
  cart_id!: string
  userInfo!: { fullName: string, phone: string, address: string }
  products!: Array<{ product_id: any, price: number, discountPercentage: number, quantity: number }>
  status!: string

  constructor(data: any = {}) {
    super(data)
    this.user_id = data.user_id || null
    this.cart_id = data.cart_id || ''
    this.userInfo = data.userInfo || { fullName: '', phone: '', address: '' }
    this.products = data.products || []
    this.status = data.status || 'pending'
  }
}

export class ForgotPassword extends BaseModel {
  static tableName = 'forgot_passwords'
  static columns = ['id', 'email', 'otp', 'expireAt', 'createdAt', 'updatedAt']
  static jsonFields: string[] = []
  static hasSoftDelete = false

  email!: string
  otp!: string
  expireAt!: string

  constructor(data: any = {}) {
    super(data)
    this.email = data.email || ''
    this.otp = data.otp || ''
    this.expireAt = data.expireAt || ''
  }
}

export class AuditLog extends BaseModel {
  static tableName = 'audit_logs'
  static columns = ['id', 'account_id', 'action', 'details', 'timestamp']
  static jsonFields: string[] = []
  static hasSoftDelete = false

  account_id!: string
  action!: string
  details!: string
  timestamp!: string

  constructor(data: any = {}) {
    super(data)
    this.account_id = data.account_id || ''
    this.action = data.action || ''
    this.details = data.details || ''
    this.timestamp = data.timestamp || new Date().toISOString()
  }
}
