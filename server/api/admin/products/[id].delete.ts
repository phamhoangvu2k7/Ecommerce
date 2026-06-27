import { defineEventHandler, createError, getRouterParam } from "h3";
import { ProductService } from "../../../utils/services.ts";
import { AuditLog } from "../../../utils/models.ts";

export default defineEventHandler(async (event) => {
  const permissions = event.context.admin?.role_id?.permissions || [];
  if (!permissions.includes("products_delete")) {
    throw createError({
      statusCode: 403,
      statusMessage: "Bạn không có quyền xóa sản phẩm."
    });
  }

  const id = getRouterParam(event, "id");
  const adminId = event.context.admin._id.toString();

  await ProductService.deleteProduct(id, adminId);

  // Log activity
  const audit = new AuditLog({
    account_id: event.context.admin._id,
    action: "DELETE_PRODUCT",
    details: `Xóa mềm sản phẩm (ID: ${id})`
  });
  await audit.save();

  return {
    success: true,
    message: "Xóa sản phẩm thành công (đã chuyển vào Thùng rác)."
  };
});
