import { db } from "@/db";
import { quizAttempts, topics } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ProgressChart, ChartDataPoint } from "@/components/history/ProgressChart";
import { OwlMascot } from "@/components/owl/OwlMascot";
import { PetAvatar } from "@/components/pet/PetAvatar";
import { StreakBadge } from "@/components/pet/StreakBadge";
import { getActivePetAction } from "@/actions/pet";
import {
  Award,
  History,
  TrendingUp,
  Clock,
  Brain,
  CheckCircle2,
  Calendar,
  Layers,
  GraduationCap,
  Flame,
  ArrowRight,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lịch sử Điểm số & Biểu đồ Tiến bộ - IELTS Flashcard",
  description: "Theo dõi tiến độ học tập và biểu đồ điểm số các bài kiểm tra từ vựng.",
};

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const session = await getSession();

  if (!session) {
    redirect("/dang-nhap?redirect=/lich-su");
  }

  // Lấy active pet của học viên
  let activePet = null;
  try {
    const petRes = await getActivePetAction();
    activePet = petRes.data;
  } catch (e) {
    console.warn("Could not fetch active pet for history:", e);
  }

  // Lấy toàn bộ các bài thi của học viên
  const attempts = await db
    .select({
      id: quizAttempts.id,
      mode: quizAttempts.mode,
      topicIds: quizAttempts.topicIds,
      totalQuestions: quizAttempts.totalQuestions,
      correctAnswers: quizAttempts.correctAnswers,
      scorePercent: quizAttempts.scorePercent,
      timeSpentSeconds: quizAttempts.timeSpentSeconds,
      createdAt: quizAttempts.createdAt,
    })
    .from(quizAttempts)
    .where(eq(quizAttempts.userId, session.userId))
    .orderBy(desc(quizAttempts.createdAt));

  // Thu thập tất cả topic IDs để tra cứu tên chủ đề
  const allTopicIds = Array.from(
    new Set(attempts.flatMap((a) => (a.topicIds || []) as string[]))
  );

  const topicNameMap = new Map<string, string>();
  if (allTopicIds.length > 0) {
    const topicRows = await db
      .select({ id: topics.id, name: topics.name })
      .from(topics)
      .where(inArray(topics.id, allTopicIds));

    topicRows.forEach((t) => topicNameMap.set(t.id, t.name));
  }

  // Tính các chỉ số thống kê
  const totalAttempts = attempts.length;
  let averageScore = 0;
  let highestScore = 0;
  let totalTimeSeconds = 0;

  if (totalAttempts > 0) {
    const sumScore = attempts.reduce((acc, curr) => acc + parseFloat(curr.scorePercent), 0);
    averageScore = Math.round(sumScore / totalAttempts);
    highestScore = Math.round(
      Math.max(...attempts.map((a) => parseFloat(a.scorePercent)))
    );
    totalTimeSeconds = attempts.reduce((acc, curr) => acc + (curr.timeSpentSeconds || 0), 0);
  }

  const formatTotalTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    if (hours > 0) return `${hours} giờ ${mins} phút`;
    return `${mins} phút`;
  };

  const getModeLabel = (mode: string) => {
    if (mode === "multiple_choice") return "Trắc nghiệm 4 đáp án";
    if (mode === "typing") return "Gõ từ tiếng Anh";
    if (mode === "flip_card") return "Lật thẻ tự đánh giá";
    return mode;
  };

  // Dữ liệu cho biểu đồ Recharts (sắp xếp theo thứ tự thời gian tăng dần)
  const chartData: ChartDataPoint[] = [...attempts]
    .reverse()
    .slice(-15) // 15 bài thi gần nhất
    .map((item, idx) => ({
      index: idx + 1,
      dateStr: new Date(item.createdAt).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      }),
      score: parseFloat(item.scorePercent),
      mode: getModeLabel(item.mode),
    }));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-light)]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-[var(--surface-raised)] border border-[var(--border-medium)] text-[var(--navy)] rounded-full mb-2">
            <OwlMascot variant="badge" size={18} />
            <span>Bảng vàng tiến độ • Cú Tri Thức</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-[var(--ink)]">
            Lịch sử & Biểu đồ Tiến bộ
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[var(--ink-secondary)]">
            Theo dõi sự tích luỹ và cải thiện độ chính xác từ vựng qua từng lần kiểm tra.
          </p>
        </div>

        <Link
          href="/kiem-tra"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--navy)] text-[#faf7f2] hover:bg-[var(--navy-hover)] text-xs font-semibold transition-all shadow-xs hover:-translate-y-0.5 active:translate-y-0 self-start sm:self-auto"
        >
          <Brain className="w-4 h-4 text-[var(--amber)]" />
          <span>Làm bài kiểm tra mới</span>
        </Link>
      </div>

      {/* Pet & Streak Banner */}
      {activePet && (
        <div className="p-4 sm:p-5 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-[var(--surface)] to-amber-500/5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <PetAvatar
              species={activePet.species.id}
              stage={activePet.pet.stage}
              size={54}
            />
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="font-serif font-bold text-sm text-[var(--ink)]">
                  {activePet.pet.petName} ({activePet.species.name})
                </span>
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full">
                  {activePet.stageDetail.label} {activePet.stageDetail.emoji}
                </span>
              </div>
              <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
                {activePet.dialogue}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <StreakBadge
              count={activePet.pet.currentStreak}
              isTodayCompleted={activePet.isTodayCompleted}
              size="md"
              showLabel
            />
            <Link
              href="/thu-cung"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--navy)] text-white hover:bg-[var(--navy-hover)] transition-colors shadow-2xs"
            >
              <span>Phòng thú cưng</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* 4 Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-lg bg-[var(--surface)] border border-[var(--border-light)] shadow-xs">
          <div className="flex items-center justify-between text-[var(--navy)]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)]">
              Bài thi đã làm
            </span>
            <History className="w-4 h-4" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-serif font-bold text-[var(--ink)]">
            {totalAttempts}
          </p>
        </div>

        <div className="p-5 rounded-lg bg-[var(--surface)] border border-[var(--border-light)] shadow-xs">
          <div className="flex items-center justify-between text-[var(--sage)]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)]">
              Điểm trung bình
            </span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-serif font-bold text-[var(--sage)]">
            {averageScore}%
          </p>
        </div>

        <div className="p-5 rounded-lg bg-[var(--surface)] border border-[var(--border-light)] shadow-xs">
          <div className="flex items-center justify-between text-[var(--burgundy)]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)]">
              Điểm cao nhất
            </span>
            <Award className="w-4 h-4" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-serif font-bold text-[var(--burgundy)]">
            {highestScore}%
          </p>
        </div>

        <div className="p-5 rounded-lg bg-[var(--surface)] border border-[var(--border-light)] shadow-xs">
          <div className="flex items-center justify-between text-[var(--navy)]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)]">
              Thời gian luyện
            </span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="mt-2 text-lg sm:text-xl font-serif font-bold text-[var(--ink)]">
            {formatTotalTime(totalTimeSeconds)}
          </p>
        </div>
      </div>

      {/* Progress Chart (Recharts) */}
      <div className="p-6 rounded-lg bg-[var(--surface)] border border-[var(--border-light)] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-light)]">
          <div>
            <h2 className="font-serif font-bold text-base text-[var(--ink)]">
              Biểu đồ Diễn biến Điểm số
            </h2>
            <p className="text-xs text-[var(--ink-secondary)]">
              Độ chính xác qua các lần làm bài gần đây (thang đo 0% – 100%)
            </p>
          </div>
        </div>

        <ProgressChart data={chartData} />
      </div>

      {/* Attempts History Table */}
      <div className="bg-[var(--surface)] border border-[var(--border-light)] rounded-lg overflow-hidden shadow-xs space-y-0">
        <div className="p-5 border-b border-[var(--border-light)]">
          <h2 className="font-serif font-bold text-base text-[var(--ink)]">
            Chi tiết các Lần làm Bài
          </h2>
          <p className="text-xs text-[var(--ink-secondary)]">
            Bảng lịch sử ghi lại thời gian, phạm vi chủ đề, số câu đúng và điểm số
          </p>
        </div>

        {attempts.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <OwlMascot variant="reading" size={80} className="mx-auto" />
            <h3 className="font-serif font-bold text-base text-[var(--ink)]">
              Chưa có dữ liệu bài kiểm tra nào
            </h3>
            <p className="text-xs text-[var(--ink-secondary)] max-w-sm mx-auto">
              Cú Tri Thức đang đợi ghi nhận thành tích đầu tiên của bạn. Hãy hoàn thành 1 bài kiểm tra để theo dõi đường cong ghi nhớ nhé!
            </p>
            <div className="pt-2">
              <Link
                href="/kiem-tra"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--navy)] text-white hover:bg-[var(--navy-hover)] transition-colors"
              >
                <span>Bắt đầu bài kiểm tra ngay</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-raised)] text-[var(--ink-secondary)] border-b border-[var(--border-light)]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Ngày làm</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Hình thức</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Phạm vi chủ đề</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-right">Số câu đúng</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-right">Điểm số</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-right">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light)]">
                {attempts.map((attempt) => {
                  const scoreNum = parseFloat(attempt.scorePercent);
                  const topicIds = (attempt.topicIds || []) as string[];
                  const topicNames = topicIds
                    .map((id) => topicNameMap.get(id) || "Chủ đề")
                    .join(", ");

                  return (
                    <tr key={attempt.id} className="hover:bg-[var(--surface-raised)]/40 transition-colors">
                      <td className="py-3 px-4 font-medium text-[var(--ink)]">
                        {new Date(attempt.createdAt).toLocaleDateString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 text-[var(--ink-secondary)]">
                        {getModeLabel(attempt.mode)}
                      </td>
                      <td className="py-3 px-4 text-[var(--ink-secondary)] max-w-xs truncate" title={topicNames}>
                        {topicNames || "Tất cả"}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-[var(--ink)]">
                        {attempt.correctAnswers} / {attempt.totalQuestions}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-bold text-xs ${
                            scoreNum >= 80
                              ? "bg-[var(--sage-light)] text-[var(--sage)]"
                              : scoreNum >= 50
                              ? "bg-[var(--surface-raised)] text-[var(--navy)]"
                              : "bg-[var(--wine-light)] text-[var(--burgundy)]"
                          }`}
                        >
                          {attempt.scorePercent}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-[var(--ink-muted)] font-mono">
                        {Math.floor((attempt.timeSpentSeconds || 0) / 60)}:
                        {((attempt.timeSpentSeconds || 0) % 60).toString().padStart(2, "0")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

