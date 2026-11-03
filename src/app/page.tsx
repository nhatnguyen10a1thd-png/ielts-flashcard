import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { STRINGS } from "@/lib/constants/strings";
import { db } from "@/db";
import { topics, words, users } from "@/db/schema";
import { sql, isNull, eq } from "drizzle-orm";
import { OwlMascot } from "@/components/owl/OwlMascot";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  GraduationCap,
  Award,
  Zap,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getSession();

  // Fetch quick public statistics with fallback
  let topicsTotal = 0;
  let wordsTotal = 0;
  let learnersTotal = 0;

  try {
    const [topicCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(topics)
      .where(isNull(topics.deletedAt));
    topicsTotal = Number(topicCount?.count || 0);

    const [wordCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(words);
    wordsTotal = Number(wordCount?.count || 0);

    const [learnerCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "learner"));
    learnersTotal = Number(learnerCount?.count || 0);
  } catch (err) {
    console.warn("Could not fetch home statistics:", err);
  }

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section with Scholarly Owl */}
      <section className="relative pt-12 sm:pt-20 pb-16 px-4 sm:px-6 lg:px-8 border-b border-[var(--border-light)] bg-gradient-to-b from-[var(--surface-raised)]/70 via-[var(--canvas)] to-[var(--canvas)] overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-[var(--amber)]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          {/* Owl Mascot Hero Presentation */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="relative">
              <div className="p-3 rounded-full bg-[var(--surface)] border border-[var(--border-medium)] shadow-sm animate-owl-float">
                <OwlMascot variant="studious" size={120} />
              </div>
              <span className="absolute -bottom-2 bg-[var(--amber)] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs tracking-wider uppercase">
                {STRINGS.app.mascotName}
              </span>
            </div>

            {/* Owl Speech Bubble */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--amber)]/40 bg-[var(--surface)] text-xs font-medium text-[var(--ink)] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[var(--amber)] animate-ping" />
              <span>&ldquo;{STRINGS.owl.dailyQuote}&rdquo;</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-[var(--ink)] tracking-tight leading-tight">
            Nắm vững từ vựng IELTS <br className="hidden sm:inline" />
            <span className="italic font-serif text-[var(--navy)]">
              cùng phong thái học giả uyên bác
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-[var(--ink-secondary)] leading-relaxed">
            Học tập kiên trì như loài cú đêm với phương pháp Flashcard hai chiều, phát âm chuẩn IPA
            và hệ thống kiểm tra kiến thức đa dạng giúp bạn ghi nhớ vững chắc mỗi ngày.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/chu-de"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-lg bg-[var(--navy)] text-[#faf7f2] hover:bg-[var(--navy-hover)] text-sm font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              <GraduationCap className="w-4 h-4 text-[var(--amber)]" />
              <span>Bắt đầu học ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {!user ? (
              <Link
                href="/dang-ky"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg border border-[var(--border-medium)] bg-[var(--surface)] hover:bg-[var(--surface-raised)] text-[var(--ink)] text-sm font-semibold transition-colors shadow-xs"
              >
                <span>Tạo tài khoản học viên</span>
              </Link>
            ) : user.role === "admin" ? (
              <Link
                href="/admin"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg border border-[var(--burgundy)] bg-[var(--wine-light)] text-[var(--burgundy)] text-sm font-semibold transition-colors shadow-xs"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Khu vực Quản trị</span>
              </Link>
            ) : (
              <Link
                href="/kiem-tra"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg border border-[var(--border-medium)] bg-[var(--surface)] hover:bg-[var(--surface-raised)] text-[var(--ink)] text-sm font-semibold transition-colors shadow-xs"
              >
                <Brain className="w-4 h-4 text-[var(--navy)]" />
                <span>Làm bài kiểm tra</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Numerical Stats with Owl Scholarly Medals */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-xl border border-[var(--border-light)] bg-[var(--surface)] text-center shadow-xs">
          <div className="p-4 border-b md:border-b-0 md:border-r border-[var(--border-light)] flex flex-col items-center">
            <span className="w-8 h-8 rounded-full bg-[var(--amber-light)] text-[var(--amber)] flex items-center justify-center mb-2">
              <BookOpen className="w-4 h-4" />
            </span>
            <span className="block text-3xl sm:text-4xl font-serif font-bold text-[var(--navy)]">
              {topicsTotal.toLocaleString("vi-VN")}
            </span>
            <span className="mt-1 block text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)]">
              Chủ đề học thuật
            </span>
          </div>

          <div className="p-4 border-b md:border-b-0 md:border-r border-[var(--border-light)] flex flex-col items-center">
            <span className="w-8 h-8 rounded-full bg-[var(--wine-light)] text-[var(--burgundy)] flex items-center justify-center mb-2">
              <Award className="w-4 h-4" />
            </span>
            <span className="block text-3xl sm:text-4xl font-serif font-bold text-[var(--burgundy)]">
              {wordsTotal.toLocaleString("vi-VN")}
            </span>
            <span className="mt-1 block text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)]">
              Từ vựng chuẩn IELTS
            </span>
          </div>

          <div className="p-4 flex flex-col items-center">
            <span className="w-8 h-8 rounded-full bg-[var(--sage-light)] text-[var(--sage)] flex items-center justify-center mb-2">
              <Zap className="w-4 h-4" />
            </span>
            <span className="block text-3xl sm:text-4xl font-serif font-bold text-[var(--sage)]">
              {learnersTotal.toLocaleString("vi-VN")}
            </span>
            <span className="mt-1 block text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)]">
              Học giả chăm chỉ
            </span>
          </div>
        </div>
      </section>

      {/* Core Feature Highlights */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-raised)] text-[var(--navy)] text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[var(--amber)]" />
            <span>Phương pháp học bền bỉ</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--ink)]">
            Học tập khoa học & không gián đoạn
          </h2>
          <p className="text-sm text-[var(--ink-secondary)] max-w-xl mx-auto">
            Giao diện tối giản tập trung, loại bỏ hoàn toàn các yếu tố gây xao nhãng để bạn tích lũy từ vựng sâu sắc nhất.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--border-light)] hover:border-[var(--border-medium)] transition-all space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-[var(--surface-raised)] text-[var(--navy)] flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5 text-[var(--navy)]" />
            </div>
            <h3 className="text-lg font-serif font-bold text-[var(--ink)]">Lật thẻ 3D hai chiều tức thì</h3>
            <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
              Học Anh → Việt hoặc đảo chiều Việt → Anh. Hỗ trợ thao tác phím Space cực nhanh và cử chỉ vuốt mượt mà trên màn hình cảm ứng di động.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--border-light)] hover:border-[var(--border-medium)] transition-all space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-[var(--surface-raised)] text-[var(--burgundy)] flex items-center justify-center font-bold">
              <Brain className="w-5 h-5 text-[var(--burgundy)]" />
            </div>
            <h3 className="text-lg font-serif font-bold text-[var(--ink)]">3 Chế độ kiểm tra ngẫu nhiên</h3>
            <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
              Tự đánh giá trí nhớ, trắc nghiệm 4 đáp án và gõ từ chuẩn xác. Thuật toán Fisher–Yates đảm bảo mỗi bài thi luôn mới mẻ.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--border-light)] hover:border-[var(--border-medium)] transition-all space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-[var(--surface-raised)] text-[var(--sage)] flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5 text-[var(--sage)]" />
            </div>
            <h3 className="text-lg font-serif font-bold text-[var(--ink)]">Theo dõi tiến độ học tập</h3>
            <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
              Hệ thống tự động ghi nhớ các từ đã thuộc và các từ cần ôn luyện, giúp bạn tập trung vào những từ vựng chưa vững.
            </p>
          </div>
        </div>
      </section>

      {/* Diligent Owl Study Tip Banner */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[var(--surface-raised)] via-[var(--surface)] to-[var(--surface-raised)] border border-[var(--border-medium)] flex flex-col sm:flex-row items-center gap-6 shadow-xs">
          <OwlMascot variant="reading" size={90} className="shrink-0" />
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-block text-[11px] font-bold uppercase tracking-wider text-[var(--amber)]">
              Lời khuyên từ Cú Tri Thức
            </div>
            <h4 className="text-lg font-serif font-bold text-[var(--ink)]">
              &ldquo;Mỗi ngày 15 phút kiên trì hơn 3 tiếng học dồn&rdquo;
            </h4>
            <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
              Não bộ ghi nhớ ngôn ngữ tốt nhất thông qua kỹ thuật lặp lại ngắt quãng (Spaced Repetition). Hãy chọn 1 chủ đề mỗi ngày và làm bài kiểm tra ngắn trước khi kết thúc buổi học!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
