import { defineEventHandler, createError } from "h3";
import { Account } from "../../../utils/models.ts";

export default defineEventHandler(async (event) => {
  const permissions = event.context.admin?.role_id?.permissions || [];
  if (!permissions.includes("accounts_view")) {
    throw createError({
      statusCode: 403,
      statusMessage: "Bạn không có quyền xem tài khoản quản trị."
    });
  }

  try {
    const accounts = await Account.find({}).populate("role_id").sort({ createdAt: "desc" }).lean();
    return {
      success: true,
      accounts
    };
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: "Lỗi hệ thống khi tải danh sách tài khoản quản trị."
    });
  }
});
