import jwt from "jsonwebtoken";
import { defineEventHandler, createError, readBody } from "h3";
import { User } from "../../../utils/models.ts";
import { hashPassword, getJwtSecret } from "../../../utils/helpers.ts";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { resetToken, password } = body;

  if (!resetToken || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: "Thiếu thông tin khôi phục mật khẩu."
    });
  }

  if (password.length < 6) {
    throw createError({
      statusCode: 400,
      statusMessage: "Mật khẩu mới phải chứa ít nhất 6 ký tự."
    });
  }

  try {
    const decoded: any = jwt.verify(resetToken, getJwtSecret());
    if (decoded.role !== "reset-password") {
      throw new Error();
    }

    const email = decoded.email;
    const user = await User.findOne({ email });
    if (!user) {
      throw createError({
        statusCode: 400,
        statusMessage: "Tài khoản người dùng không tồn tại."
      });
    }

    user.password = hashPassword(password);
    await user.save();

    return {
      success: true,
      message: "Đổi mật khẩu mới thành công. Hãy đăng nhập lại bằng mật khẩu mới."
    };
  } catch (err) {
    throw createError({
      statusCode: 400,
      statusMessage: "Mã xác thực đổi mật khẩu đã hết hạn hoặc không hợp lệ."
    });
  }
});




