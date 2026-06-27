import { defineEventHandler, createError, readBody } from "h3";
import { User, Cart } from "../../../utils/models.ts";
import { RegisterValidation } from "../../../utils/validation.ts";
import { hashPassword } from "../../../utils/helpers.ts";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = RegisterValidation.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.errors.map((e) => e.message).join(", ")
    });
  }

  const { fullName, email, password, phone } = parsed.data;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw createError({
      statusCode: 400,
      statusMessage: "Email này đã được đăng ký sử dụng."
    });
  }

  const user = new User({
    fullName,
    email,
    password: hashPassword(password),
    phone,
    status: "active"
  });

  await user.save();

  // Initialize an empty cart for this user
  const cart = new Cart({
    user_id: user._id,
    products: []
  });
  await cart.save();

  return {
    success: true,
    message: "Đăng ký tài khoản thành công."
  };
});




