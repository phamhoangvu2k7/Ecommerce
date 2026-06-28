import { defineEventHandler, createError, readBody } from "h3";
import { Account } from "../../../utils/models.ts";
import { hashPassword } from "../../../utils/helpers.ts";

export default defineEventHandler(async (event) => {
  const permissions = event.context.admin?.role_id?.permissions || [];
  if (!permissions.includes("accounts_create")) {
    throw createError({
      statusCode: 403,
      statusMessage: "Bạn không có quyền tạo tài khoản quản trị."
    });
  }

  const body = await readBody(event);
  if (!body.fullName || !body.email || !body.password) {
    throw createError({
      statusCode: 400,
      statusMessage: "Vui lòng nhập đầy đủ thông tin bắt buộc."
    });
  }

  try {
    const existing = await Account.findOne({ email: body.email });
    if (existing) {
      throw createError({
        statusCode: 400,
        statusMessage: "Email này đã được sử dụng."
      });
    }

    const account = new Account({
      fullName: body.fullName,
      email: body.email,
      password: hashPassword(body.password),
      role_id: body.role_id || null,
      phone: body.phone || "",
      avatar: body.avatar || "",
      status: body.status || "active"
    });

    await account.save();

    return {
      success: true,
      account
    };
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || "Lỗi hệ thống khi tạo tài khoản quản trị."
    });
  }
});
