import Link from "next/link";
import { notFound } from "next/navigation";
import { getTestDetailAction } from "@/actions/test";
import { OwlMascot } from "@/components/owl/OwlMascot";
import {
  Clock,
  HelpCircle,
  Trophy,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  History,
  Sparkles,
} from "lucide-react";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function TestDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const res = await getTestDetailAction(slug);

  if (!res.success || !res.data) {
    notFound();
  }

  const { test, userAttempts } = res.data;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Link */}
      <Link
        href="/de-thi"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ink-secondary)] hover:text-[var(--navy)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Quay lại Kho Đề thi</span>
      </Link>

      {/* Main Test Intro Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border-light)] shadow-xs space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--surface-raised)] border border-[var(--border-light)] text-[var(--ink-secondary)] uppercase">
              {test.category}
            </span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Target: Band {test.targetBand || "4.5 - 7.5"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--ink)]">
            {test.title}
          </h1>

          {test.description && (
            <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
              {test.description}
            </p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-[var(--surface-raised)]/60 border border-[var(--border-light)] text-center">
          <div className="space-y-1">
            <div className="text-xs text-[var(--ink-muted)]">Thời gian làm bài</div>
            <div className="text-lg font-bold text-[var(--navy)] flex items-center justify-center gap-1">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>{test.durationMinutes} phút</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-[var(--ink-muted)]">Số lượng câu hỏi</div>
            <div className="text-lg font-bold text-[var(--navy)] flex items-center justify-center gap-1">
              <HelpCircle className="w-4 h-4 text-sky-600" />
              <span>{test.totalQuestions} câu</span>
            </div>
          </div>

          <div className="space-y-1 col-span-2 sm:col-span-1">
            <div className="text-xs text-[var(--ink-muted)]">Điểm đạt chuẩn</div>
            <div className="text-lg font-bold text-[var(--navy)] flex items-center justify-center gap-1">
              <Trophy className="w-4 h-4 text-emerald-600" />
              <span>≥ {test.passingScorePercent}%</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-3 p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 text-xs sm:text-sm text-[var(--ink)] leading-relaxed">
          <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Quy định & Lưu ý trước khi bấm bắt đầu:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 pl-1 text-[var(--ink-secondary)]">
            <li>Đồng hồ sẽ bắt đầu đếm ngược ngay khi bạn bước vào phòng thi.</li>
            <li>Bạn có thể nhảy câu tùy ý bằng <strong>Bảng câu hỏi (Question Palette)</strong> bên tay phải.</li>
            <li>Tính năng <strong>Gắn cờ (Flag)</strong> giúp bạn ghi nhớ những câu chưa chắc chắn để xem lại trước khi nộp.</li>
            <li>Khi hết thời gian, hệ thống sẽ <strong>tự động thu bài</strong> và chấm điểm ngay lập tức.</li>
          </ul>
        </div>

        {/* Start Button */}
        <div className="pt-2 flex justify-end">
          <Link
            href={`/de-thi/${test.slug}/lam-bai`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-base font-bold bg-[var(--navy)] text-white hover:bg-[var(--navy-hover)] transition-all shadow-md hover:shadow-lg"
          >
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>Bắt đầu làm bài ngay</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Attempt History */}
      {userAttempts && userAttempts.length > 0 && (
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border-light)] shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-bold font-serif text-base text-[var(--ink)]">
            <History className="w-4 h-4 text-[var(--navy)]" />
            <span>Lịch sử các lần làm đề thi này</span>
          </div>

          <div className="divide-y divide-[var(--border-light)]">
            {userAttempts.map((att: any, idx: number) => {
              const dateStr = new Date(att.submittedAt).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={att.id}
                  className="py-3 flex items-center justify-between gap-4 text-xs sm:text-sm"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-[var(--ink)]">
                      Lần làm #{userAttempts.length - idx}
                    </div>
                    <div className="text-[var(--ink-muted)] text-xs">{dateStr}</div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold text-emerald-600">
                        Band {att.estimatedBand}
                      </div>
                      <div className="text-xs text-[var(--ink-muted)]">
                        {att.totalCorrect}/{att.totalQuestions} câu ({att.scorePercent}%)
                      </div>
                    </div>

                    <Link
                      href={`/de-thi/${test.slug}/ket-qua/${att.id}`}
                      className="px-3 py-1.5 rounded-lg border border-[var(--border-light)] bg-[var(--surface-raised)] text-xs font-semibold text-[var(--navy)] hover:bg-[var(--navy)] hover:text-white transition-colors"
                    >
                      Xem lại
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

