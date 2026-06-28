import { defineEventHandler, createError } from "h3";
import { Role } from "../../../utils/models.ts";

export default defineEventHandler(async (event) => {
  const permissions = event.context.admin?.role_id?.permissions || [];
  if (!permissions.includes("roles_view")) {
    throw createError({
      statusCode: 403,
      statusMessage: "Bạn không có quyền xem nhóm quyền."
    });
  }

  try {
    const roles = await Role.find({}).sort({ createdAt: "desc" }).lean();
    return {
      success: true,
      roles
    };
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: "Lỗi hệ thống khi tải danh sách nhóm quyền."
    });
  }
});
