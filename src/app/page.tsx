import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { STRINGS } from "@/lib/constants/strings";
import { db } from "@/db";
import { topics, words, users } from "@/db/schema";
import { sql, isNull, eq } from "drizzle-orm";
import { ArrowRight, BookOpen, Brain, Sparkles, CheckCircle2, ShieldCheck } from "lucide-react";

export default async function HomePage() {
  const user = await getSession();

  // Fetch quick public statistics
  const [topicCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(topics)
    .where(andTopicsActive());

  const [wordCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(words);

  const [learnerCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.role, "learner"));

  function andTopicsActive() {
    return isNull(topics.deletedAt);
  }

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative pt-16 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 border-b border-[var(--border-light)] bg-gradient-to-b from-[var(--surface-raised)]/60 to-[var(--canvas)]">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--border-medium)] bg-[var(--surface)] text-xs font-semibold uppercase tracking-wider text-[var(--navy)] shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[var(--burgundy)]" />
            <span>Phương pháp Flashcard kinh điển</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-[var(--ink)] tracking-tight leading-tight">
            Nắm vững từ vựng IELTS <br className="hidden sm:inline" />
            <span className="italic font-serif text-[var(--navy)]">bằng sự tập trung thuần khiết</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-[var(--ink-secondary)] leading-relaxed">
            Hệ thống học từ vựng chia theo chủ đề chuyên sâu, lật thẻ hai chiều, phát âm chuẩn xác và kiểm tra tự động. Giao diện trang nhã giúp bạn học sâu mà không bị phân tâm.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/chu-de"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-[var(--navy)] text-[#faf7f2] hover:bg-[var(--navy-hover)] text-sm font-semibold transition-colors shadow-xs"
            >
              <span>{STRINGS.flashcard.studyNow}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {!user ? (
              <Link
                href="/dang-ky"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md border border-[var(--border-medium)] bg-[var(--surface)] hover:bg-[var(--surface-raised)] text-[var(--ink)] text-sm font-semibold transition-colors"
              >
                <span>Tạo tài khoản miễn phí</span>
              </Link>
            ) : user.role === "admin" ? (
              <Link
                href="/admin"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md border border-[var(--burgundy)] bg-[var(--wine-light)] text-[var(--burgundy)] text-sm font-semibold transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Khu vực Quản trị</span>
              </Link>
            ) : (
              <Link
                href="/kiem-tra"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md border border-[var(--border-medium)] bg-[var(--surface)] hover:bg-[var(--surface-raised)] text-[var(--ink)] text-sm font-semibold transition-colors"
              >
                <span>Làm bài kiểm tra</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Numerical Stats */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-lg border border-[var(--border-light)] bg-[var(--surface)] text-center shadow-xs">
          <div className="p-4 border-b md:border-b-0 md:border-r border-[var(--border-light)]">
            <span className="block text-3xl sm:text-4xl font-serif font-bold text-[var(--navy)]">
              {Number(topicCount?.count || 0).toLocaleString("vi-VN")}
            </span>
            <span className="mt-1 block text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)]">
              Chủ đề học tập
            </span>
          </div>

          <div className="p-4 border-b md:border-b-0 md:border-r border-[var(--border-light)]">
            <span className="block text-3xl sm:text-4xl font-serif font-bold text-[var(--burgundy)]">
              {Number(wordCount?.count || 0).toLocaleString("vi-VN")}
            </span>
            <span className="mt-1 block text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)]">
              Từ vựng chọn lọc
            </span>
          </div>

          <div className="p-4">
            <span className="block text-3xl sm:text-4xl font-serif font-bold text-[var(--sage)]">
              {Number(learnerCount?.count || 0).toLocaleString("vi-VN")}
            </span>
            <span className="mt-1 block text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)]">
              Học viên đã tham gia
            </span>
          </div>
        </div>
      </section>

      {/* Core Feature Highlights */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--ink)]">
            Trải nghiệm học tập tinh giản & hiệu quả
          </h2>
          <p className="text-sm text-[var(--ink-secondary)] max-w-xl mx-auto">
            Không quảng cáo, không âm thanh giật gân, chỉ có kiến thức và sự tập trung của bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-lg bg-[var(--surface)] border border-[var(--border-light)] space-y-3">
            <div className="w-10 h-10 rounded-md bg-[var(--surface-raised)] text-[var(--navy)] flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-serif font-bold text-[var(--ink)]">Lật thẻ hai chiều linh hoạt</h3>
            <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
              Học từ Anh sang Việt hoặc đảo ngược từ Việt sang Anh. Hỗ trợ thao tác lật thẻ bằng bàn phím Space và vuốt mượt mà trên điện thoại.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-[var(--surface)] border border-[var(--border-light)] space-y-3">
            <div className="w-10 h-10 rounded-md bg-[var(--surface-raised)] text-[var(--burgundy)] flex items-center justify-center font-bold">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-serif font-bold text-[var(--ink)]">3 Kiểu kiểm tra kiến thức</h3>
            <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
              Tự đánh giá, trắc nghiệm 4 đáp án thông minh và gõ lại từ vựng. Thuật toán Fisher–Yates xáo trộn câu hỏi ngẫu nhiên mỗi lần thi.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-[var(--surface)] border border-[var(--border-light)] space-y-3">
            <div className="w-10 h-10 rounded-md bg-[var(--surface-raised)] text-[var(--sage)] flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-serif font-bold text-[var(--ink)]">Nhập dữ liệu quy mô lớn</h3>
            <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
              Dành riêng cho Quản trị viên: tải lên file Excel hoặc CSV hàng chục nghìn từ vựng. Tự động kiểm tra trùng và báo cáo chi tiết.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
