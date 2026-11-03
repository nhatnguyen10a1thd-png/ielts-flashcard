"use client";

import { useActionState, useEffect } from "react";
import { firstLoginChangePasswordAction } from "@/actions/auth";
import { STRINGS } from "@/lib/constants/strings";
import { KeyRound, ShieldAlert, AlertCircle } from "lucide-react";

export default function FirstLoginChangePasswordPage() {
  const [state, formAction, isPending] = useActionState(
    firstLoginChangePasswordAction,
    { success: false }
  );

  useEffect(() => {
    if (state.success && state.data?.redirectUrl) {
      window.location.href = state.data.redirectUrl;
    }
  }, [state]);

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-[var(--surface)] border-2 border-[var(--burgundy)]/40 rounded-lg p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-[var(--wine-light)] text-[var(--burgundy)] flex items-center justify-center mx-auto mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider uppercase bg-[var(--wine-light)] text-[var(--burgundy)] rounded-full mb-3">
            Bảo mật quản trị
          </span>
          <h1 className="text-2xl font-serif font-bold text-[var(--ink)]">
            {STRINGS.auth.firstLoginChangeTitle}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[var(--ink-secondary)] leading-relaxed">
            {STRINGS.auth.firstLoginChangeSubtitle}
          </p>
        </div>

        {state.error && (
          <div className="mb-6 p-3 bg-[var(--wine-light)] border border-[var(--burgundy)]/30 rounded-md flex items-center gap-2.5 text-xs text-[var(--burgundy)] font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)] mb-1.5">
              Mật khẩu khởi tạo ban đầu
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--ink-muted)]">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                type="password"
                name="currentPassword"
                required
                placeholder="Nhập mật khẩu được cấp khi seed"
                className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--surface-raised)] border border-[var(--border-medium)] rounded-md text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--navy)] focus:border-[var(--navy)] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)] mb-1.5">
              Mật khẩu mới của bạn
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--ink-muted)]">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                type="password"
                name="newPassword"
                required
                placeholder="Tối thiểu 8 ký tự, có chữ và số"
                className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--surface-raised)] border border-[var(--border-medium)] rounded-md text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--navy)] focus:border-[var(--navy)] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)] mb-1.5">
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--ink-muted)]">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                type="password"
                name="confirmPassword"
                required
                placeholder="Nhập lại mật khẩu mới"
                className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--surface-raised)] border border-[var(--border-medium)] rounded-md text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--navy)] focus:border-[var(--navy)] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending || state.success}
            className="w-full py-2.5 px-4 mt-2 rounded-md bg-[var(--burgundy)] hover:bg-[var(--burgundy-hover)] text-[#faf7f2] text-sm font-medium transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {state.success
              ? "Đang chuyển hướng..."
              : isPending
              ? "Đang xử lý..."
              : STRINGS.auth.changePasswordButton}
          </button>
        </form>
      </div>
    </div>
  );
}

