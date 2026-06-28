import { defineEventHandler, createError } from "h3";
import { Account } from "../../../utils/models.ts";

export default defineEventHandler(async (event) => {
  const permissions = event.context.admin?.role_id?.permissions || [];
  if (!permissions.includes("accounts_delete")) {
    throw createError({
      statusCode: 403,
      statusMessage: "Bạn không có quyền xóa tài khoản quản trị."
    });
  }

  const id = event.context.params?.id;

  if (String(id) === String(event.context.admin?._id)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bạn không thể tự xóa tài khoản của chính mình."
    });
  }

  try {
    const account = await Account.findById(id);
    if (!account || account.deleted) {
      throw createError({
        statusCode: 404,
        statusMessage: "Không tìm thấy tài khoản quản trị."
      });
    }

    account.deleted = true;
    account.deletedAt = new Date();
    account.deletedBy = event.context.admin?._id;

    await account.save();

    return {
      success: true,
      message: "Xóa tài khoản thành công."
    };
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || "Lỗi hệ thống khi xóa tài khoản quản trị."
    });
  }
});
