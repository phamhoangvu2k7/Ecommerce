import { defineEventHandler, readBody, createError } from "h3";
import { Product, AuditLog } from "../../../utils/models.ts";
import { ProductValidation } from "../../../utils/validation.ts";

export default defineEventHandler(async (event) => {
  // Check permission
  const permissions = event.context.admin?.role_id?.permissions || [];
  if (!permissions.includes("products_create")) {
    throw createError({
      statusCode: 403,
      statusMessage: "Bạn không có quyền tạo sản phẩm."
    });
  }

  const body = await readBody(event);
  const parsed = ProductValidation.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.errors.map((e) => e.message).join(", ")
    });
  }

  // If position is not custom set, auto-increment based on max position
  let position = parsed.data.position;
  if (!position) {
    const lastProduct = await Product.findOne({}).sort({ position: -1 });
    position = lastProduct ? lastProduct.position + 1 : 1;
  }

  const product = new Product({
    ...parsed.data,
    position,
    createdBy: event.context.admin._id
  });

  await product.save();

  // Log activity
  const audit = new AuditLog({
    account_id: event.context.admin._id,
    action: "CREATE_PRODUCT",
    details: `Tạo sản phẩm mới: ${product.title} (ID: ${product._id})`
  });
  await audit.save();

  return {
    success: true,
    message: "Tạo sản phẩm mới thành công.",
    product
  };
});
