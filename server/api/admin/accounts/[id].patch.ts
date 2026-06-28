import { defineEventHandler, createError, readBody } from "h3";
import { Account } from "../../../utils/models.ts";
import { hashPassword } from "../../../utils/helpers.ts";

export default defineEventHandler(async (event) => {
  const permissions = event.context.admin?.role_id?.permissions || [];
  if (!permissions.includes("accounts_edit")) {
    throw createError({
      statusCode: 403,
      statusMessage: "Bạn không có quyền chỉnh sửa tài khoản quản trị."
    });
  }

  const id = event.context.params?.id;
  const body = await readBody(event);

  try {
    const account = await Account.findById(id);
    if (!account || account.deleted) {
      throw createError({
        statusCode: 404,
        statusMessage: "Không tìm thấy tài khoản quản trị."
      });
    }

    if (body.email && body.email !== account.email) {
      const existing = await Account.findOne({ email: body.email });
      if (existing) {
        throw createError({
          statusCode: 400,
          statusMessage: "Email này đã được sử dụng."
        });
      }
      account.email = body.email;
    }

    if (body.fullName !== undefined) account.fullName = body.fullName;
    if (body.password) account.password = hashPassword(body.password);
    if (body.role_id !== undefined) account.role_id = body.role_id || null;
    if (body.phone !== undefined) account.phone = body.phone;
    if (body.avatar !== undefined) account.avatar = body.avatar;
    if (body.status !== undefined) account.status = body.status;

    await account.save();

    return {
      success: true,
      account
    };
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || "Lỗi hệ thống khi cập nhật tài khoản quản trị."
    });
  }
});
