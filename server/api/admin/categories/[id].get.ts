import { defineEventHandler, createError, getRouterParam } from "h3";
import { ProductCategory } from "../../../utils/models.ts";

export default defineEventHandler(async (event) => {
  const permissions = event.context.admin?.role_id?.permissions || [];
  if (!permissions.includes("categories_view")) {
    throw createError({
      statusCode: 403,
      statusMessage: "Bạn không có quyền xem thông tin danh mục sản phẩm."
    });
  }

  const id = getRouterParam(event, "id");
  const category = await ProductCategory.findById(id).populate("parent_id");
  if (!category) {
    throw createError({
      statusCode: 404,
      statusMessage: "Không tìm thấy danh mục sản phẩm."
    });
  }

  return {
    success: true,
    category
  };
});
