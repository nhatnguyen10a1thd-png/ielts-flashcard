import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Địa chỉ email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Họ và tên phải có ít nhất 2 ký tự")
      .max(100, "Họ và tên không vượt quá 100 ký tự"),
    email: z.string().trim().email("Địa chỉ email không hợp lệ"),
    password: z
      .string()
      .min(8, "Mật khẩu phải chứa ít nhất 8 ký tự")
      .regex(/[A-Za-z]/, "Mật khẩu phải có ít nhất một chữ cái")
      .regex(/[0-9]/, "Mật khẩu phải có ít nhất một chữ số"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không trùng khớp",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Địa chỉ email không hợp lệ"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Mã xác thực không hợp lệ"),
    password: z
      .string()
      .min(8, "Mật khẩu phải chứa ít nhất 8 ký tự")
      .regex(/[A-Za-z]/, "Mật khẩu phải có ít nhất một chữ cái")
      .regex(/[0-9]/, "Mật khẩu phải có ít nhất một chữ số"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không trùng khớp",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z
      .string()
      .min(8, "Mật khẩu mới phải chứa ít nhất 8 ký tự")
      .regex(/[A-Za-z]/, "Mật khẩu mới phải có ít nhất một chữ cái")
      .regex(/[0-9]/, "Mật khẩu mới phải có ít nhất một chữ số"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không trùng khớp",
    path: ["confirmPassword"],
  });

