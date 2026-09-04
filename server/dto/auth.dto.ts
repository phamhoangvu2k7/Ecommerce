import { z } from 'zod'

// ==========================================
// Login DTO
// ==========================================
export const LoginValidation = z.object({
  email: z.string({ required_error: 'Email không được để trống' }).email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
})
export const LoginInputSchema = LoginValidation
export type LoginInputDTO = z.infer<typeof LoginInputSchema>

// ==========================================
// Register DTO
// ==========================================
export const RegisterValidation = z.object({
  fullName: z.string().min(1, 'Họ và tên không được để trống'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự trở lên'),
  phone: z.string().optional(),
})
export const RegisterInputSchema = RegisterValidation
export type RegisterInputDTO = z.infer<typeof RegisterInputSchema>

// ==========================================
// Refresh Token DTO
// ==========================================
export const RefreshTokenInputSchema = z.object({
  refreshToken: z.string().optional(),
})
export type RefreshTokenInputDTO = z.infer<typeof RefreshTokenInputSchema>

// ==========================================
// Reset Password DTO
// ==========================================
export const ResetPasswordInputSchema = z.object({
  resetToken: z.string().min(1, 'Token không được để trống'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải từ 6 ký tự trở lên'),
})
export type ResetPasswordInputDTO = z.infer<typeof ResetPasswordInputSchema>

// ==========================================
// Auth JWT Payload DTO
// ==========================================
export const AuthJwtPayloadSchema = z.object({
  id: z.string(),
  role: z.enum(['admin', 'client']),
  fullName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  permissions: z.array(z.string()).optional().default([]),
})
export type AuthJwtPayloadDTO = z.infer<typeof AuthJwtPayloadSchema>
