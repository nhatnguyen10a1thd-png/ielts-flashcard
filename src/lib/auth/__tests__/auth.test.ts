import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../password";
import { createSessionToken, verifySessionToken } from "../session";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  changePasswordSchema,
} from "../../validations/auth";

describe("Xác thực và Mật khẩu (Auth & Password)", () => {
  it("Băm mật khẩu và đối chiếu chính xác bằng bcrypt", async () => {
    const raw = "SuperSecretPassword123!";
    const hash = await hashPassword(raw);

    expect(hash).not.toBe(raw);
    expect(hash.startsWith("$2")).toBe(true);

    const isMatch = await verifyPassword(raw, hash);
    expect(isMatch).toBe(true);

    const isWrong = await verifyPassword("WrongPassword!", hash);
    expect(isWrong).toBe(false);
  });

  it("Tạo và giải mã Session JWT token chính xác", async () => {
    const payload = {
      userId: "user-123",
      email: "learner@ielts.vn",
      fullName: "Nguyễn Văn Học",
      role: "learner" as const,
      mustChangePassword: false,
    };

    const token = await createSessionToken(payload);
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);

    const decoded = await verifySessionToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.email).toBe(payload.email);
    expect(decoded?.role).toBe("learner");
    expect(decoded?.mustChangePassword).toBe(false);
  });

  it("Từ chối Session token sai chữ ký hoặc hỏng", async () => {
    const badToken = "invalid.jwt.token";
    const decoded = await verifySessionToken(badToken);
    expect(decoded).toBeNull();
  });
});

describe("Xác thực biểu mẫu Zod (Auth Validations)", () => {
  it("Xác thực đăng nhập hợp lệ và không hợp lệ", () => {
    const valid = loginSchema.safeParse({
      email: "test@example.com",
      password: "somepassword",
    });
    expect(valid.success).toBe(true);

    const invalidEmail = loginSchema.safeParse({
      email: "not-an-email",
      password: "password",
    });
    expect(invalidEmail.success).toBe(false);
  });

  it("Xác thực đăng ký: kiểm tra độ dài mật khẩu và khớp xác nhận", () => {
    // Valid
    const valid = registerSchema.safeParse({
      fullName: "Nguyễn Văn A",
      email: "test@example.com",
      password: "Password123",
      confirmPassword: "Password123",
    });
    expect(valid.success).toBe(true);

    // Mismatched passwords
    const mismatch = registerSchema.safeParse({
      fullName: "Nguyễn Văn A",
      email: "test@example.com",
      password: "Password123",
      confirmPassword: "DifferentPassword123",
    });
    expect(mismatch.success).toBe(false);

    // Too short password
    const short = registerSchema.safeParse({
      fullName: "Nguyễn Văn A",
      email: "test@example.com",
      password: "short",
      confirmPassword: "short",
    });
    expect(short.success).toBe(false);
  });

  it("Xác thực đổi mật khẩu: yêu cầu cả chữ và số, tối thiểu 8 ký tự", () => {
    const valid = changePasswordSchema.safeParse({
      currentPassword: "OldPassword123",
      newPassword: "NewSecurePassword888",
      confirmPassword: "NewSecurePassword888",
    });
    expect(valid.success).toBe(true);

    const onlyLetters = changePasswordSchema.safeParse({
      currentPassword: "OldPassword123",
      newPassword: "OnlyLettersNoNumbers",
      confirmPassword: "OnlyLettersNoNumbers",
    });
    expect(onlyLetters.success).toBe(false);
  });
});

