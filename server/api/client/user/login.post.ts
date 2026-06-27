import { defineEventHandler, readBody, createError, setCookie, deleteCookie, parseCookies } from "h3";
import jwt from "jsonwebtoken";
import { User } from "../../../utils/models.ts";
import { LoginValidation } from "../../../utils/validation.ts";
import { comparePassword } from "../../../utils/helpers.ts";
import { CartService } from "../../../utils/services.ts";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = LoginValidation.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.errors.map((e) => e.message).join(", ")
    });
  }

  const { email, password } = parsed.data;

  const user = await User.findOne({ email });
  if (!user || user.deleted) {
    throw createError({
      statusCode: 400,
      statusMessage: "Email hoặc mật khẩu không chính xác."
    });
  }

  if (!comparePassword(password, user.password)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Email hoặc mật khẩu không chính xác."
    });
  }

  if (user.status !== "active") {
    throw createError({
      statusCode: 400,
      statusMessage: "Tài khoản của bạn đang bị khóa."
    });
  }

  // --- Cart Merging Algorithm ---
  const cookies = parseCookies(event);
  const guestCartId = cookies.cartId;
  if (guestCartId) {
    try {
      await CartService.mergeCarts(guestCartId, user._id.toString());
      deleteCookie(event, "cartId");
    } catch (err) {
      console.error("[CartMerging] Failed to merge carts on login:", err);
    }
  }

  // Issue Token
  const token = jwt.sign(
    { id: user._id, role: "client" },
    process.env.JWT_SECRET || "a_very_secret_jwt_key_123456",
    { expiresIn: "7d" }
  );

  // Set Cookie
  setCookie(event, "token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });

  return {
    success: true,
    message: "Đăng nhập thành công.",
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar
    }
  };
});
