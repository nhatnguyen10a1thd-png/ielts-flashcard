import Link from "next/link";
import { OwlMascot } from "@/components/owl/OwlMascot";
import { STRINGS } from "@/lib/constants/strings";
import { Home, BookOpen, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center bg-[var(--surface)] border border-[var(--border-light)] rounded-xl p-8 sm:p-10 shadow-sm">
        <OwlMascot variant="thinking" size={96} className="mx-auto mb-4" />

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-raised)] border border-[var(--border-medium)] text-xs font-semibold text-[var(--ink-secondary)] uppercase tracking-wider mb-3">
          <Compass className="w-3.5 h-3.5 text-[var(--amber)]" />
          <span>Lỗi 404</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--ink)] mb-2">
          Không tìm thấy trang
        </h1>
        <p className="text-xs sm:text-sm text-[var(--ink-secondary)] leading-relaxed mb-8">
          Đường dẫn bạn yêu cầu không tồn tại, đã bị đổi tên hoặc chuyển sang vị trí khác. Hãy để cú Olli dẫn đường bạn trở lại bài học!
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-[var(--navy)] text-[#faf7f2] hover:bg-[var(--navy-hover)] text-sm font-medium transition-colors shadow-xs"
          >
            <Home className="w-4 h-4" />
            <span>Về trang chủ</span>
          </Link>
          <Link
            href="/chu-de"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md border border-[var(--border-medium)] bg-[var(--surface-raised)] text-[var(--ink)] hover:bg-[var(--border-light)] text-sm font-medium transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span>Xem chủ đề học</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

