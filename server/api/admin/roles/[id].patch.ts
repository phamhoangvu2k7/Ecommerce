import { defineEventHandler, createError, readBody } from "h3";
import { Role } from "../../../utils/models.ts";

export default defineEventHandler(async (event) => {
  const permissions = event.context.admin?.role_id?.permissions || [];
  if (!permissions.includes("roles_permissions") && !permissions.includes("roles_edit")) {
    throw createError({
      statusCode: 403,
      statusMessage: "Bạn không có quyền chỉnh sửa nhóm quyền."
    });
  }

  const id = event.context.params?.id;
  const body = await readBody(event);

  try {
    const role = await Role.findById(id);
    if (!role || role.deleted) {
      throw createError({
        statusCode: 404,
        statusMessage: "Không tìm thấy nhóm quyền."
      });
    }

    if (body.title !== undefined) role.title = body.title;
    if (body.description !== undefined) role.description = body.description;
    if (body.permissions !== undefined) role.permissions = body.permissions;

    await role.save();

    return {
      success: true,
      role
    };
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || "Lỗi hệ thống khi cập nhật nhóm quyền."
    });
  }
});
