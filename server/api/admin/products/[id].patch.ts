import { defineEventHandler, readBody, createError, getRouterParam } from "h3";
import { Product, AuditLog } from "../../../utils/models.ts";
import { ProductValidation } from "../../../utils/validation.ts";
import { slugify } from "../../../utils/helpers.ts";

export default defineEventHandler(async (event) => {
  const permissions = event.context.admin?.role_id?.permissions || [];
  if (!permissions.includes("products_edit")) {
    throw createError({
      statusCode: 403,
      statusMessage: "Bạn không có quyền chỉnh sửa sản phẩm."
    });
  }

  const id = getRouterParam(event, "id");
  const body = await readBody(event);

  // Validate fields
  const parsed = ProductValidation.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.errors.map((e) => e.message).join(", ")
    });
  }

  const product = await Product.findOneAndUpdate(
    { _id: id },
    {
      ...parsed.data,
      slug: slugify(parsed.data.title),
      updatedBy: event.context.admin._id
    },
    { new: true }
  );

  if (!product) {
    throw createError({
      statusCode: 404,
      statusMessage: "Không tìm thấy sản phẩm để cập nhật."
    });
  }

  // Log activity
  const audit = new AuditLog({
    account_id: event.context.admin._id,
    action: "UPDATE_PRODUCT",
    details: `Cập nhật sản phẩm: ${product.title} (ID: ${product._id})`
  });
  await audit.save();

  return {
    success: true,
    message: "Cập nhật sản phẩm thành công.",
    product
  };
});
