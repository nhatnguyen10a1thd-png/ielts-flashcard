"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  setSessionCookie,
  clearSessionCookie,
  getSession,
  SessionUser,
} from "@/lib/auth/session";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "@/lib/validations/auth";
import { sendPasswordResetEmail } from "@/lib/email/mailer";
import crypto from "crypto";
import { redirect } from "next/navigation";

export interface ActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

export async function loginAction(
  prevState: unknown,
  formData: FormData
): Promise<ActionResult<{ redirectUrl: string }>> {
  const rawEmail = formData.get("email")?.toString() || "";
  const rawPassword = formData.get("password")?.toString() || "";

  const parsed = loginSchema.safeParse({ email: rawEmail, password: rawPassword });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { email, password } = parsed.data;

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      return { success: false, error: "Email hoặc mật khẩu không chính xác." };
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return { success: false, error: "Email hoặc mật khẩu không chính xác." };
    }

    const sessionUser: SessionUser = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as "admin" | "learner",
      mustChangePassword: user.mustChangePassword,
    };

    await setSessionCookie(sessionUser);

    let redirectUrl = user.role === "admin" ? "/admin" : "/chu-de";
    if (user.mustChangePassword) {
      redirectUrl = "/doi-mat-khau-lan-dau";
    }

    return { success: true, data: { redirectUrl } };
  } catch (err) {
    console.error("Login action error:", err);
    return { success: false, error: "Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau." };
  }
}

export async function registerAction(
  prevState: unknown,
  formData: FormData
): Promise<ActionResult<{ redirectUrl: string }>> {
  const rawFullName = formData.get("fullName")?.toString() || "";
  const rawEmail = formData.get("email")?.toString() || "";
  const rawPassword = formData.get("password")?.toString() || "";
  const rawConfirm = formData.get("confirmPassword")?.toString() || "";

  const parsed = registerSchema.safeParse({
    fullName: rawFullName,
    email: rawEmail,
    password: rawPassword,
    confirmPassword: rawConfirm,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { fullName, email, password } = parsed.data;

  try {
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existing) {
      return { success: false, error: "Email này đã được sử dụng. Vui lòng chọn email khác." };
    }

    const passwordHash = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        fullName,
        role: "learner",
        mustChangePassword: false,
      })
      .returning();

    const sessionUser: SessionUser = {
      userId: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: "learner",
      mustChangePassword: false,
    };

    await setSessionCookie(sessionUser);

    return { success: true, data: { redirectUrl: "/chu-de" } };
  } catch (err) {
    console.error("Register action error:", err);
    return { success: false, error: "Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau." };
  }
}

export async function forgotPasswordAction(
  prevState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const rawEmail = formData.get("email")?.toString() || "";
  const parsed = forgotPasswordSchema.safeParse({ email: rawEmail });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { email } = parsed.data;

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      // Don't leak whether user exists
      return {
        success: true,
        error: undefined,
      };
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db
      .update(users)
      .set({
        resetToken,
        resetTokenExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/dat-lai-mat-khau?token=${resetToken}`;

    await sendPasswordResetEmail({
      to: user.email,
      fullName: user.fullName,
      resetUrl,
    });

    return { success: true };
  } catch (err) {
    console.error("Forgot password error:", err);
    return { success: false, error: "Đã xảy ra lỗi khi tạo yêu cầu. Vui lòng thử lại." };
  }
}

export async function resetPasswordAction(
  prevState: unknown,
  formData: FormData
): Promise<ActionResult<{ redirectUrl: string }>> {
  const token = formData.get("token")?.toString() || "";
  const password = formData.get("password")?.toString() || "";
  const confirmPassword = formData.get("confirmPassword")?.toString() || "";

  const parsed = resetPasswordSchema.safeParse({ token, password, confirmPassword });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(eq(users.resetToken, token), gt(users.resetTokenExpiresAt, new Date()))
      )
      .limit(1);

    if (!user) {
      return {
        success: false,
        error: "Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu lại.",
      };
    }

    const passwordHash = await hashPassword(parsed.data.password);

    await db
      .update(users)
      .set({
        passwordHash,
        resetToken: null,
        resetTokenExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return { success: true, data: { redirectUrl: "/dang-nhap?reset=thanh-cong" } };
  } catch (err) {
    console.error("Reset password error:", err);
    return { success: false, error: "Đã xảy ra lỗi khi đặt lại mật khẩu." };
  }
}

export async function firstLoginChangePasswordAction(
  prevState: unknown,
  formData: FormData
): Promise<ActionResult<{ redirectUrl: string }>> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." };
  }

  const currentPassword = formData.get("currentPassword")?.toString() || "";
  const newPassword = formData.get("newPassword")?.toString() || "";
  const confirmPassword = formData.get("confirmPassword")?.toString() || "";

  const parsed = changePasswordSchema.safeParse({
    currentPassword,
    newPassword,
    confirmPassword,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user) {
      return { success: false, error: "Người dùng không tồn tại." };
    }

    const isCurrentValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return { success: false, error: "Mật khẩu hiện tại không chính xác." };
    }

    if (currentPassword === newPassword) {
      return { success: false, error: "Mật khẩu mới không được trùng với mật khẩu cũ." };
    }

    const newHash = await hashPassword(newPassword);

    await db
      .update(users)
      .set({
        passwordHash: newHash,
        mustChangePassword: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Update active session with mustChangePassword = false
    await setSessionCookie({
      ...session,
      mustChangePassword: false,
    });

    return {
      success: true,
      data: { redirectUrl: session.role === "admin" ? "/admin" : "/chu-de" },
    };
  } catch (err) {
    console.error("First login change password error:", err);
    return { success: false, error: "Đã xảy ra lỗi khi cập nhật mật khẩu." };
  }
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/dang-nhap");
}

