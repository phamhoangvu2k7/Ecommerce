import { defineEventHandler, deleteCookie } from "h3";
export default defineEventHandler((event) => {
  deleteCookie(event, "token");
  return {
    success: true,
    message: "Đăng xuất thành công"
  };
});
