import { z } from 'zod'

// ==========================================
// Checkout DTO
// ==========================================
export const CheckoutValidation = z.object({
  fullName: z.string().min(1, 'Họ tên người nhận không được để trống'),
  phone: z.string().min(9, 'Số điện thoại nhận hàng không hợp lệ'),
  address: z.string().min(1, 'Địa chỉ nhận hàng không được để trống'),
  cartId: z.string().min(1, 'Giỏ hàng không hợp lệ'),
})
export const CheckoutInputSchema = CheckoutValidation
export type CheckoutInputDTO = z.infer<typeof CheckoutInputSchema>
