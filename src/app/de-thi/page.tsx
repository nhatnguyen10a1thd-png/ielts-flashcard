import Link from "next/link";
import { getAllTestsAction, TestListItem } from "@/actions/test";
import { OwlMascot } from "@/components/owl/OwlMascot";
import {
  Clock,
  HelpCircle,
  Trophy,
  ArrowRight,
  Filter,
  Sparkles,
  Award,
  CheckCircle2,
  FileText,
} from "lucide-react";

interface TestsPageProps {
  searchParams: Promise<{
    category?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function TestsPage({ searchParams }: TestsPageProps) {
  const params = await searchParams;
  const currentCategory = params.category || "all";

  const res = await getAllTestsAction(
    currentCategory === "all" ? undefined : currentCategory
  );
  const testsList: TestListItem[] = res.success && res.data ? res.data : [];

  const categories = [
    { id: "all", label: "Tất cả đề thi" },
    { id: "placement", label: "🧭 Khảo sát Đầu vào" },
    { id: "mini_test", label: "⚡ Mini-Test (15 phút)" },
    { id: "milestone", label: "🎯 Đánh giá Chặng" },
    { id: "mock_test", label: "📝 Đề thi Toàn diện" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--surface-raised)] to-[var(--surface)] border border-[var(--border-light)] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--amber)]/10 text-[var(--amber-dark)] text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Trung tâm Khảo thí & Luyện đề IELTS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--ink)]">
              Kho Đề Thi Thử & Kiểm Tra Năng Lực
            </h1>
            <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
              Trải nghiệm phòng thi trực tuyến chuẩn hóa: Tính giờ thời gian thực, bảng điều hướng câu hỏi linh hoạt, chấm điểm quy đổi thang Band IELTS và xem giải thích chi tiết từng câu.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-[var(--surface)]/80 backdrop-blur-xs p-4 rounded-xl border border-[var(--border-light)] self-stretch sm:self-auto shrink-0">
            <OwlMascot variant="studious" size={60} />
            <div className="space-y-1">
              <div className="text-xs text-[var(--ink-muted)]">Cú Giám Thị</div>
              <div className="text-sm font-bold text-[var(--ink)]">
                {testsList.length} Đề thi sẵn sàng
              </div>
              <span className="text-[11px] text-[var(--amber-dark)] font-semibold">
                Bấm giờ & Chấm điểm tự động
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((c) => {
          const isActive = currentCategory === c.id;
          return (
            <Link
              key={c.id}
              href={c.id === "all" ? "/de-thi" : `/de-thi?category=${c.id}`}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-[var(--navy)] text-white shadow-xs"
                  : "bg-[var(--surface)] border border-[var(--border-light)] text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:bg-[var(--surface-raised)]"
              }`}
            >
              {c.label}
            </Link>
          );
        })}
      </div>

      {/* Tests Grid */}
      {testsList.length === 0 ? (
        <div className="text-center py-16 space-y-3 bg-[var(--surface)] rounded-2xl border border-[var(--border-light)]">
          <FileText className="w-10 h-10 text-[var(--ink-muted)] mx-auto" />
          <h3 className="text-base font-bold text-[var(--ink)]">
            Chưa có đề thi trong mục này
          </h3>
          <p className="text-xs text-[var(--ink-secondary)]">
            Vui lòng chọn danh mục khác để luyện tập.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testsList.map((test) => {
            const categoryLabels: Record<string, string> = {
              placement: "Khảo sát đầu vào",
              milestone: "Đánh giá chặng",
              mini_test: "Mini-Test",
              mock_test: "Mock Test",
            };

            return (
              <div
                key={test.id}
                className="flex flex-col justify-between p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border-light)] shadow-xs hover:border-[var(--amber)] hover:shadow-md transition-all group"
              >
                <div className="space-y-4">
                  {/* Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[var(--surface-raised)] border border-[var(--border-light)] text-[var(--ink-secondary)]">
                      {categoryLabels[test.category] || test.category}
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Band {test.targetBand || "4.5 - 7.5"}
                    </span>
                  </div>

                  {/* Title & Desc */}
                  <div className="space-y-1.5">
                    <h3 className="font-serif font-bold text-base sm:text-lg text-[var(--ink)] group-hover:text-[var(--navy)] transition-colors leading-snug line-clamp-2">
                      {test.title}
                    </h3>
                    {test.description && (
                      <p className="text-xs text-[var(--ink-secondary)] leading-relaxed line-clamp-3">
                        {test.description}
                      </p>
                    )}
                  </div>

                  {/* Test Meta Info */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border-light)] text-xs text-[var(--ink-muted)]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>{test.durationMinutes} phút</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
                      <span>{test.totalQuestions} câu hỏi</span>
                    </div>
                  </div>

                  {/* User Best Score Badge if attempted */}
                  {test.attemptCount !== undefined && test.attemptCount > 0 && (
                    <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 flex items-center justify-between text-xs">
                      <span className="text-amber-900 dark:text-amber-200 font-medium flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        Đã làm: {test.attemptCount} lần
                      </span>
                      {test.bestBand && (
                        <span className="font-bold text-emerald-600">
                          Band cao nhất: {test.bestBand}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div className="pt-6">
                  <Link
                    href={`/de-thi/${test.slug}`}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-[var(--navy)] text-white hover:bg-[var(--navy-hover)] transition-colors shadow-xs"
                  >
                    <span>Xem chi tiết & Làm bài</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
