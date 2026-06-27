import jwt from "jsonwebtoken";
import { defineEventHandler, parseCookies, getHeader, createError } from "h3";
import { Account, User } from "../utils/models.ts";

export default defineEventHandler(async (event) => {
  const path = event.path || "";

  // 1. Extract token from Cookie or Authorization header
  const cookies = parseCookies(event);
  let token = cookies.token;

  if (!token) {
    const authHeader = getHeader(event, "authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  // 2. Decode token and inject user/admin context
  if (token) {
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "a_very_secret_jwt_key_123456");
      if (decoded.role === "admin") {
        const account = await Account.findById(decoded.id).populate("role_id");
        if (account && account.status === "active") {
          event.context.admin = account;
        }
      } else {
        const user = await User.findById(decoded.id);
        if (user && user.status === "active") {
          event.context.user = user;
        }
      }
    } catch (err) {
      // Token expired or invalid
      console.warn("[AuthMiddleware] JWT Token verification failed.");
    }
  }

  // 3. Enforce Route-level Authentication Checks
  // Protect all admin APIs except /api/admin/auth/login
  if (path.startsWith("/api/admin") && !path.startsWith("/api/admin/auth/login")) {
    if (!event.context.admin) {
      throw createError({
        statusCode: 401,
        statusMessage: "Bạn cần đăng nhập bằng tài khoản quản trị để truy cập."
      });
    }
  }
});
