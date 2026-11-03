"use client";

import { useActionState } from "react";
import { registerAction } from "@/actions/auth";
import Link from "next/link";
import { useEffect } from "react";
import { STRINGS } from "@/lib/constants/strings";
import { OwlMascot } from "@/components/owl/OwlMascot";
import { KeyRound, Mail, User, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, {
    success: false,
  });

  useEffect(() => {
    if (state.success && state.data?.redirectUrl) {
      window.location.href = state.data.redirectUrl;
    }
  }, [state]);

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border-light)] rounded-lg p-8 shadow-xs">
        <div className="text-center mb-6">
          <OwlMascot variant="studious" size={72} className="mx-auto mb-2" />
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--ink)]">
            {STRINGS.auth.registerTitle}
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-[var(--ink-secondary)]">
            {STRINGS.auth.registerSubtitle}
          </p>
        </div>

        {state.error && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-6 p-3 bg-[var(--wine-light)] border border-[var(--burgundy)]/30 rounded-md flex items-center gap-2.5 text-xs text-[var(--burgundy)] font-medium"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        <form action={formAction} method="post" className="space-y-4">
          <div>
            <label
              htmlFor="register-fullname"
              className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)] mb-1.5"
            >
              {STRINGS.auth.fullNameLabel}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--ink-muted)]">
                <User className="w-4 h-4" />
              </span>
              <input
                id="register-fullname"
                type="text"
                name="fullName"
                required
                autoComplete="name"
                placeholder={STRINGS.auth.fullNamePlaceholder}
                className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--surface-raised)] border border-[var(--border-medium)] rounded-md text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--navy)] focus:border-[var(--navy)] transition-colors"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="register-email"
              className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)] mb-1.5"
            >
              {STRINGS.auth.emailLabel}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--ink-muted)]">
                <Mail className="w-4 h-4" />
              </span>
              <input
                id="register-email"
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder={STRINGS.auth.emailPlaceholder}
                className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--surface-raised)] border border-[var(--border-medium)] rounded-md text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--navy)] focus:border-[var(--navy)] transition-colors"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="register-password"
              className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)] mb-1.5"
            >
              {STRINGS.auth.passwordLabel}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--ink-muted)]">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                id="register-password"
                type="password"
                name="password"
                required
                autoComplete="new-password"
                placeholder="Tối thiểu 8 ký tự, có chữ và số"
                className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--surface-raised)] border border-[var(--border-medium)] rounded-md text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--navy)] focus:border-[var(--navy)] transition-colors"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="register-confirm-password"
              className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)] mb-1.5"
            >
              {STRINGS.auth.confirmPasswordLabel}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--ink-muted)]">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                id="register-confirm-password"
                type="password"
                name="confirmPassword"
                required
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu vừa đặt"
                className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--surface-raised)] border border-[var(--border-medium)] rounded-md text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--navy)] focus:border-[var(--navy)] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending || state.success}
            className="w-full py-2.5 px-4 mt-2 rounded-md bg-[var(--navy)] hover:bg-[var(--navy-hover)] text-[#faf7f2] text-sm font-medium transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {state.success
              ? "Đang chuyển hướng..."
              : isPending
              ? "Đang xử lý..."
              : STRINGS.auth.registerButton}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[var(--border-light)] text-center text-xs text-[var(--ink-secondary)]">
          <span>{STRINGS.auth.hasAccountPrompt} </span>
          <Link href="/dang-nhap" className="font-semibold text-[var(--navy)] hover:underline">
            {STRINGS.auth.loginButton}
          </Link>
        </div>
      </div>
    </div>
  );
}

