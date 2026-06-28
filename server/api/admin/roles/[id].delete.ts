import { defineEventHandler, createError } from "h3";
import { Role } from "../../../utils/models.ts";

export default defineEventHandler(async (event) => {
  const permissions = event.context.admin?.role_id?.permissions || [];
  if (!permissions.includes("roles_delete")) {
    throw createError({
      statusCode: 403,
      statusMessage: "Bạn không có quyền xóa nhóm quyền."
    });
  }

  const id = event.context.params?.id;

  try {
    const role = await Role.findById(id);
    if (!role || role.deleted) {
      throw createError({
        statusCode: 404,
        statusMessage: "Không tìm thấy nhóm quyền."
      });
    }

    role.deleted = true;
    role.deletedAt = new Date();
    role.deletedBy = event.context.admin?._id;

    await role.save();

    return {
      success: true,
      message: "Xóa nhóm quyền thành công."
    };
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || "Lỗi hệ thống khi xóa nhóm quyền."
    });
  }
});
