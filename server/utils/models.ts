import mongoose, { Schema, Document } from "mongoose";
import { prependImageDomain, stripImageDomain } from "~/server/utils/helpers.ts";

// --- Custom Mongoose Soft Delete Plugin ---
export function softDeletePlugin(schema: Schema) {
  schema.add({
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: String, ref: "Account", default: null },
    createdBy: { type: String, ref: "Account", default: null },
    updatedBy: { type: String, ref: "Account", default: null }
  });

  // Query middleware to automatically filter out deleted documents
  const queryMethods = [
    "find",
    "findOne",
    "countDocuments",
    "estimatedDocumentCount",
    "findOneAndUpdate",
    "updateOne",
    "updateMany"
  ];

  queryMethods.forEach((method) => {
    schema.pre(method as any, function (this: any) {
      const filter = this.getFilter();
      // Only apply filter if deleted is not explicitly queried
      if (filter.deleted === undefined) {
        this.where({ deleted: false });
      }
    });
  });

  // Aggregate middleware to filter out deleted documents
  schema.pre("aggregate", function (this: any) {
    const pipeline = this.pipeline();
    // If the pipeline doesn't explicitly look for deleted items, filter them out first
    const hasDeletedFilter = pipeline.some(
      (stage: any) => stage.$match && stage.$match.deleted !== undefined
    );
    if (!hasDeletedFilter) {
      pipeline.unshift({ $match: { deleted: false } });
    }
  });
}

// --- 1. Role Model ---
const RoleSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    permissions: { type: [String], default: [] }
  },
  { timestamps: true }
);
RoleSchema.plugin(softDeletePlugin);
export const Role = mongoose.models.Role || mongoose.model("Role", RoleSchema, "role");

// --- 2. Account Model (Admin users) ---
const AccountSchema = new Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role_id: { type: String, ref: "Role", default: null },
    phone: { type: String, default: "" },
    avatar: { type: String, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" }
  },
  { timestamps: true }
);
AccountSchema.plugin(softDeletePlugin);
export const Account = mongoose.models.Account || mongoose.model("Account", AccountSchema, "account");

// --- 3. User Model (Client users) ---
const UserSchema = new Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, default: "" },
    avatar: { type: String, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" }
  },
  { timestamps: true }
);
UserSchema.plugin(softDeletePlugin);
export const User = mongoose.models.User || mongoose.model("User", UserSchema, "user");

// --- 4. ProductCategory Model ---
const ProductCategorySchema = new Schema(
  {
    title: { type: String, required: true },
    parent_id: { type: String, ref: "ProductCategory", default: null },
    slug: { type: String, required: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    position: { type: Number, default: 0 }
  },
  { timestamps: true }
);
ProductCategorySchema.plugin(softDeletePlugin);
export const ProductCategory =
  mongoose.models.ProductCategory || mongoose.model("ProductCategory", ProductCategorySchema, "product_category");

// --- 5. Product Model ---
const ProductSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true },
    product_category_id: { type: String, ref: "ProductCategory", default: null },
    description: { type: String, default: "" },
    price: { type: Number, required: true, default: 0 },
    discountPercentage: { type: Number, default: 0 },
    stock: { type: Number, required: true, default: 0 },
    thumbnail: {
      type: String,
      default: "",
      get: prependImageDomain,
      set: stripImageDomain
    },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    position: { type: Number, default: 0 }
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
  }
);
ProductSchema.plugin(softDeletePlugin);
export const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);

// --- 6. Cart Model ---
const CartSchema = new Schema(
  {
    user_id: { type: String, ref: "User", default: null },
    products: [
      {
        product_id: { type: String, ref: "Product", required: true },
        quantity: { type: Number, required: true, default: 1 }
      }
    ]
  },
  { timestamps: true }
);
// Cart does not need soft delete, we can delete entries or empty products array.
export const Cart = mongoose.models.Cart || mongoose.model("Cart", CartSchema);

// --- 7. Order Model ---
const OrderSchema = new Schema(
  {
    user_id: { type: String, ref: "User", default: null },
    cart_id: { type: String, required: true },
    userInfo: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true }
    },
    products: [
      {
        product_id: { type: String, ref: "Product", required: true },
        price: { type: Number, required: true },
        discountPercentage: { type: Number, default: 0 },
        quantity: { type: Number, required: true }
      }
    ],
    status: {
      type: String,
      enum: ["pending", "processing", "shipping", "delivered", "cancelled"],
      default: "pending"
    }
  },
  { timestamps: true }
);
OrderSchema.plugin(softDeletePlugin);
export const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);

// --- 8. ForgotPassword Model (with MongoDB TTL Index) ---
const ForgotPasswordSchema = new Schema(
  {
    email: { type: String, required: true },
    otp: { type: String, required: true },
    expireAt: { type: Date, required: true }
  },
  { timestamps: true }
);
// MongoDB will automatically delete documents after expireAt is reached (expireAfterSeconds: 0)
ForgotPasswordSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
export const ForgotPassword =
  mongoose.models.ForgotPassword || mongoose.model("ForgotPassword", ForgotPasswordSchema, "forgot_password");

// --- 9. AuditLog Model ---
const AuditLogSchema = new Schema({
  account_id: { type: String, ref: "Account", required: true },
  action: { type: String, required: true },
  details: { type: String, default: "" },
  timestamp: { type: Date, default: Date.now }
});
export const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
