"use client";

import { useActionState, useEffect, Suspense } from "react";
import { resetPasswordAction } from "@/actions/auth";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { STRINGS } from "@/lib/constants/strings";
import { KeyRound, AlertCircle } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [state, formAction, isPending] = useActionState(resetPasswordAction, {
    success: false,
  });

  useEffect(() => {
    if (state.success && state.data?.redirectUrl) {
      router.push(state.data.redirectUrl);
    }
  }, [state, router]);

  if (!token) {
    return (
      <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border-light)] rounded-lg p-8 shadow-xs text-center">
        <AlertCircle className="w-10 h-10 text-[var(--burgundy)] mx-auto mb-3" />
        <h2 className="text-xl font-serif font-bold text-[var(--ink)]">
          Liên kết không hợp lệ
        </h2>
        <p className="mt-2 text-sm text-[var(--ink-secondary)]">
          Mã xác thực đặt lại mật khẩu không được tìm thấy hoặc đường dẫn bị thiếu.
        </p>
        <Link
          href="/quen-mat-khau"
          className="inline-block mt-6 px-4 py-2 rounded-md bg-[var(--navy)] text-[#faf7f2] text-sm font-medium"
        >
          Yêu cầu liên kết mới
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border-light)] rounded-lg p-8 shadow-xs">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-serif font-bold text-[var(--ink)]">
          {STRINGS.auth.resetTitle}
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-secondary)]">
          {STRINGS.auth.resetSubtitle}
        </p>
      </div>

      {state.error && (
        <div className="mb-6 p-3 bg-[var(--wine-light)] border border-[var(--burgundy)]/30 rounded-md flex items-center gap-2.5 text-xs text-[var(--burgundy)] font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="token" value={token} />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)] mb-1.5">
            Mật khẩu mới
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--ink-muted)]">
              <KeyRound className="w-4 h-4" />
            </span>
            <input
              type="password"
              name="password"
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
          disabled={isPending}
          className="w-full py-2.5 px-4 mt-2 rounded-md bg-[var(--navy)] hover:bg-[var(--navy-hover)] text-[#faf7f2] text-sm font-medium transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending ? "Đang cập nhật..." : STRINGS.auth.resetButton}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-xs text-[var(--ink-muted)]">Đang tải...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
