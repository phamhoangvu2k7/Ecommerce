import { defineEventHandler, readBody, createError } from "h3";
import { ProductCategory, AuditLog } from "../../../utils/models.ts";
import { ProductCategoryValidation } from "../../../utils/validation.ts";
import { slugify } from "../../../utils/helpers.ts";

export default defineEventHandler(async (event) => {
  const permissions = event.context.admin?.role_id?.permissions || [];
  if (!permissions.includes("categories_create")) {
    throw createError({
      statusCode: 403,
      statusMessage: "Bạn không có quyền tạo danh mục sản phẩm."
    });
  }

  const body = await readBody(event);
  const parsed = ProductCategoryValidation.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.errors.map((e) => e.message).join(", ")
    });
  }

  let position = parsed.data.position;
  if (!position) {
    const lastCategory = await ProductCategory.findOne({
      parent_id: parsed.data.parent_id || null
    }).sort({ position: -1 });
    position = lastCategory ? lastCategory.position + 1 : 1;
  }

  const category = new ProductCategory({
    ...parsed.data,
    slug: slugify(parsed.data.title),
    position,
    createdBy: event.context.admin._id
  });

  await category.save();

  // Audit log
  const audit = new AuditLog({
    account_id: event.context.admin._id,
    action: "CREATE_CATEGORY",
    details: `Tạo danh mục: ${category.title} (ID: ${category._id})`
  });
  await audit.save();

  return {
    success: true,
    message: "Tạo danh mục mới thành công.",
    category
  };
});
