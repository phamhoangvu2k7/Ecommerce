import { defineEventHandler, createError, getQuery } from "h3";
import { ProductService } from "../../../utils/services.ts";

export default defineEventHandler(async (event) => {
  // Check permission
  const permissions = event.context.admin?.role_id?.permissions || [];
  if (!permissions.includes("products_view")) {
    throw createError({
      statusCode: 403,
      statusMessage: "Bạn không có quyền xem danh sách sản phẩm."
    });
  }

  const query = getQuery(event);
  const data = await ProductService.getProductsAdmin(query);

  return {
    success: true,
    data
  };
});
