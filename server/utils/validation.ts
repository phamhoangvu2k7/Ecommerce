import { z } from "zod";
import { stripImageDomain } from "~/server/utils/helpers.ts";

export const ProductValidation = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống"),
  product_category_id: z.string().nullable().optional(),
  description: z.string().optional(),
  price: z.preprocess((val) => Number(val), z.number().min(0, "Giá phải lớn hơn hoặc bằng 0")),
  discountPercentage: z.preprocess((val) => Number(val), z.number().min(0).max(100).optional().default(0)),
  stock: z.preprocess((val) => Number(val), z.number().int().min(0, "Số lượng kho phải là số nguyên >= 0")),
  thumbnail: z.string().optional().transform((val) => val ? stripImageDomain(val) : val),
  status: z.enum(["active", "inactive"]).optional().default("active"),
  position: z.preprocess((val) => Number(val), z.number().int().optional().default(0))
});

export const ProductCategoryValidation = z.object({
  title: z.string().min(1, "Tiêu đề danh mục không được để trống"),
  parent_id: z.string().nullable().optional(),
  description: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional().default("active"),
  position: z.preprocess((val) => Number(val), z.number().int().optional().default(0))
});

export const RegisterValidation = z.object({
  fullName: z.string().min(1, "Họ và tên không được để trống"),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải từ 6 ký tự trở lên"),
  phone: z.string().optional()
});

export const LoginValidation = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Mật khẩu không được để trống")
});

export const CheckoutValidation = z.object({
  fullName: z.string().min(1, "Họ tên người nhận không được để trống"),
  phone: z.string().min(9, "Số điện thoại nhận hàng không hợp lệ"),
  address: z.string().min(1, "Địa chỉ nhận hàng không được để trống"),
  cartId: z.string().min(1, "Giỏ hàng không hợp lệ")
});
