"use client";

import { useActionState, Suspense } from "react";
import { loginAction } from "@/actions/auth";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { STRINGS } from "@/lib/constants/strings";
import { KeyRound, Mail, AlertCircle, CheckCircle2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "thanh-cong";
  const redirectParam = searchParams.get("redirect");

  const [state, formAction, isPending] = useActionState(loginAction, {
    success: false,
  });

  useEffect(() => {
    if (state.success && state.data?.redirectUrl) {
      router.push(redirectParam || state.data.redirectUrl);
      router.refresh();
    }
  }, [state, router, redirectParam]);

  return (
    <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border-light)] rounded-lg p-8 shadow-xs">
      <div className="text-center mb-8">
        <span className="inline-block px-3 py-1 text-xs font-medium tracking-wider uppercase bg-[var(--surface-raised)] text-[var(--navy)] rounded-full mb-3">
          Học tập trung
        </span>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--ink)]">
          {STRINGS.auth.loginTitle}
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-secondary)]">
          {STRINGS.auth.loginSubtitle}
        </p>
      </div>

      {resetSuccess && (
        <div
          role="status"
          aria-live="polite"
          className="mb-6 p-3 bg-[var(--sage-light)] border border-[var(--sage)]/30 rounded-md flex items-center gap-2.5 text-xs text-[var(--sage)] font-medium"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Mật khẩu của bạn đã được cập nhật thành công. Vui lòng đăng nhập lại.</span>
        </div>
      )}

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

      <form action={formAction} method="post" className="space-y-5">
        <div>
          <label
            htmlFor="login-email"
            className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)] mb-1.5"
          >
            {STRINGS.auth.emailLabel}
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--ink-muted)]">
              <Mail className="w-4 h-4" />
            </span>
            <input
              id="login-email"
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
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="login-password"
              className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)]"
            >
              {STRINGS.auth.passwordLabel}
            </label>
            <Link
              href="/quen-mat-khau"
              className="text-xs text-[var(--navy)] hover:underline font-medium"
            >
              {STRINGS.auth.forgotPasswordPrompt}
            </Link>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--ink-muted)]">
              <KeyRound className="w-4 h-4" />
            </span>
            <input
              id="login-password"
              type="password"
              name="password"
              required
              autoComplete="current-password"
              placeholder={STRINGS.auth.passwordPlaceholder}
              className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--surface-raised)] border border-[var(--border-medium)] rounded-md text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--navy)] focus:border-[var(--navy)] transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 px-4 mt-2 rounded-md bg-[var(--navy)] hover:bg-[var(--navy-hover)] text-[#faf7f2] text-sm font-medium transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending ? "Đang xác thực..." : STRINGS.auth.loginButton}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-[var(--border-light)] text-center text-xs text-[var(--ink-secondary)]">
        <span>{STRINGS.auth.noAccountPrompt} </span>
        <Link href="/dang-ky" className="font-semibold text-[var(--navy)] hover:underline">
          {STRINGS.auth.registerButton}
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-xs text-[var(--ink-muted)]">Đang tải...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
