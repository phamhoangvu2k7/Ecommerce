import { defineEventHandler, readBody, createError, setCookie } from "h3";
import jwt from "jsonwebtoken";
import { Account } from "../../../utils/models.ts";
import { comparePassword, getJwtSecret } from "../../../utils/helpers.ts";
import { LoginValidation } from "../../../utils/validation.ts";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  
  // Validate input
  const parsed = LoginValidation.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.errors.map(e => e.message).join(", ")
    });
  }

  const { email, password } = parsed.data;

  const account = await Account.findOne({ email }).populate("role_id");
  if (!account || account.deleted) {
    throw createError({
      statusCode: 400,
      statusMessage: "Email không tồn tại trong hệ thống"
    });
  }

  if (!comparePassword(password, account.password)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Mật khẩu không chính xác"
    });
  }

  if (account.status !== "active") {
    throw createError({
      statusCode: 400,
      statusMessage: "Tài khoản của bạn đã bị khóa"
    });
  }

  // Generate JWT token
  const token = jwt.sign(
    { id: account._id, role: "admin" },
    getJwtSecret(),
    { expiresIn: "1d" }
  );

  // Set HTTP-only Cookie
  setCookie(event, "token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 // 1 day
  });

  return {
    success: true,
    token,
    user: {
      id: account._id,
      fullName: account.fullName,
      email: account.email,
      phone: account.phone,
      avatar: account.avatar,
      role: account.role_id
    }
  };
});
