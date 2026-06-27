import { defineEventHandler, createError } from "h3";
export default defineEventHandler((event) => {
  if (!event.context.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Chưa đăng nhập tài khoản khách hàng."
    });
  }

  return {
    success: true,
    user: {
      id: event.context.user._id,
      fullName: event.context.user.fullName,
      email: event.context.user.email,
      phone: event.context.user.phone,
      avatar: event.context.user.avatar
    }
  };
});
