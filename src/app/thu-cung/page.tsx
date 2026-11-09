import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  getActivePetAction,
  getAllUserPetsAction,
  getSpeciesCatalogAction,
  getRecentActivityLogsAction,
} from "@/actions/pet";
import { PetAvatar } from "@/components/pet/PetAvatar";
import { StreakBadge } from "@/components/pet/StreakBadge";
import { PetSelector } from "@/components/pet/PetSelector";
import { STAGE_DETAILS, PetStage } from "@/lib/pet/streak-calculator";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Flame,
  GraduationCap,
  Sparkles,
  Trophy,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ấp Trứng & Nuôi Thú Cưng Tri Thức - IELTS Flashcard",
  description: "Duy trì chuỗi ngày học liên tục để ấp trứng và tiến hoá linh vật đồng hành chinh phục IELTS.",
};

export const dynamic = "force-dynamic";

export default async function PetPage() {
  const session = await getSession();
  if (!session) {
    redirect("/dang-nhap?redirect=/thu-cung");
  }

  const [activePetRes, allPetsRes, catalogRes, activityRes] = await Promise.all([
    getActivePetAction(),
    getAllUserPetsAction(),
    getSpeciesCatalogAction(),
    getRecentActivityLogsAction(30),
  ]);

  const activeData = activePetRes.data;
  const userPets = allPetsRes.data || [];
  const speciesCatalog = catalogRes.data || [];
  const highestStreak = catalogRes.highestStreak || 0;
  const activityLogs = activityRes.data || [];

  // Build a lookup set for dates with activity
  const activeDateMap = new Map<string, { words: number; quizzes: number }>();
  activityLogs.forEach((log) => {
    activeDateMap.set(log.date, { words: log.words, quizzes: log.quizzes });
  });

  // Calculate next stage progress
  let nextStageText = "Đã đạt cấp tối thượng!";
  let progressPercent = 100;

  if (activeData) {
    const curStreak = activeData.pet.currentStreak;
    const stage = activeData.pet.stage;

    if (stage === "egg") {
      const remaining = Math.max(0, 4 - curStreak);
      nextStageText = `Còn ${remaining} ngày để trứng nở thành Sơ Sinh 🐣`;
      progressPercent = Math.min(100, Math.round((curStreak / 4) * 100));
    } else if (stage === "hatchling") {
      const remaining = Math.max(0, 8 - curStreak);
      nextStageText = `Còn ${remaining} ngày để lớn thành Bé Con 🐥`;
      progressPercent = Math.min(100, Math.round(((curStreak - 4) / 4) * 100));
    } else if (stage === "baby") {
      const remaining = Math.max(0, 15 - curStreak);
      nextStageText = `Còn ${remaining} ngày để dậy thì thành Thiếu Niên 🧒`;
      progressPercent = Math.min(100, Math.round(((curStreak - 8) / 7) * 100));
    } else if (stage === "teen") {
      const remaining = Math.max(0, 31 - curStreak);
      nextStageText = `Còn ${remaining} ngày để tốt nghiệp Trưởng Thành 🎓`;
      progressPercent = Math.min(100, Math.round(((curStreak - 15) / 16) * 100));
    } else if (stage === "adult") {
      const remaining = Math.max(0, 60 - curStreak);
      nextStageText = `Còn ${remaining} ngày để thăng hoa thành Huyền Thoại 👑`;
      progressPercent = Math.min(100, Math.round(((curStreak - 31) / 29) * 100));
    }
  }

  // Generate last 28 days for heatmap grid
  const today = new Date();
  const pastDays: Array<{ dateStr: string; dayNum: number; isToday: boolean; hasActivity: boolean }> = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    pastDays.push({
      dateStr,
      dayNum: d.getDate(),
      isToday: i === 0,
      hasActivity: activeDateMap.has(dateStr),
    });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-light)]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-full mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hệ thống Nuôi Thú Cưng Tri Thức</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-[var(--ink)]">
            Chuỗi Ngày Học & Linh Vật
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[var(--ink-secondary)]">
            Học mỗi ngày để tích lũy năng lượng ấp trứng, cùng thú cưng tiến hoá qua 6 giai đoạn kỳ diệu.
          </p>
        </div>

        <Link
          href="/chu-de"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--navy)] text-white hover:bg-[var(--navy-hover)] text-xs font-semibold transition-all shadow-xs hover:-translate-y-0.5 active:translate-y-0 self-start sm:self-auto"
        >
          <BookOpen className="w-4 h-4 text-amber-300" />
          <span>Vào học duy trì chuỗi</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 2. Active Pet Showcase Card */}
      {activeData ? (
        <div className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[var(--surface-raised)] via-[var(--surface)] to-[var(--surface-raised)] border border-[var(--border-medium)] shadow-sm overflow-hidden">
          {/* Subtle decorative glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            {/* Left: Animated Pet Avatar with Floating Base */}
            <div className="flex flex-col items-center gap-3 shrink-0">
              <div className="relative p-4 rounded-full bg-[var(--surface)] border border-[var(--border-medium)] shadow-md animate-owl-float">
                <PetAvatar
                  species={activeData.species.id}
                  stage={activeData.pet.stage}
                  size={140}
                />
              </div>

              <div className="text-center">
                <span className="inline-block px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border-light)] text-xs font-bold text-[var(--navy)]">
                  {activeData.stageDetail.label} {activeData.stageDetail.emoji}
                </span>
              </div>
            </div>

            {/* Right: Info, Dialogue & Progress */}
            <div className="flex-1 w-full space-y-5 text-center md:text-left">
              {/* Pet Name & Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-wider font-semibold text-[var(--amber)]">
                    {activeData.species.name}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--ink)]">
                    {activeData.pet.petName}
                  </h2>
                </div>

                <div className="flex items-center justify-center sm:justify-end gap-2">
                  <StreakBadge
                    count={activeData.pet.currentStreak}
                    isTodayCompleted={activeData.isTodayCompleted}
                    size="lg"
                    showLabel
                  />
                </div>
              </div>

              {/* Dialogue Bubble */}
              <div className="relative p-3.5 rounded-xl border border-amber-500/30 bg-[var(--surface)] text-xs sm:text-sm text-[var(--ink)] shadow-2xs leading-relaxed">
                <span className="font-semibold text-amber-600 dark:text-amber-400 mr-1.5">
                  &ldquo;{activeData.pet.petName}:&rdquo;
                </span>
                <span>{activeData.dialogue}</span>
              </div>

              {/* Evolution Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[var(--ink-secondary)]">
                    Tiến trình tiến hoá tiếp theo:
                  </span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {nextStageText}
                  </span>
                </div>

                <div className="w-full h-3 rounded-full bg-[var(--border-light)] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border-light)] text-center">
                  <span className="block text-[11px] font-semibold uppercase text-[var(--ink-muted)]">
                    Chuỗi hiện tại
                  </span>
                  <span className="text-lg sm:text-xl font-serif font-bold text-amber-500">
                    {activeData.pet.currentStreak} ngày
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border-light)] text-center">
                  <span className="block text-[11px] font-semibold uppercase text-[var(--ink-muted)]">
                    Kỷ lục cá nhân
                  </span>
                  <span className="text-lg sm:text-xl font-serif font-bold text-[var(--burgundy)]">
                    {activeData.pet.longestStreak} ngày
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border-light)] text-center">
                  <span className="block text-[11px] font-semibold uppercase text-[var(--ink-muted)]">
                    Tổng ngày học
                  </span>
                  <span className="text-lg sm:text-xl font-serif font-bold text-[var(--sage)]">
                    {activeData.pet.totalDaysActive} ngày
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* 3. Activity Calendar Heatmap (Last 28 Days) */}
      <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--border-light)] space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--navy)]" />
            <h3 className="font-serif font-bold text-base text-[var(--ink)]">
              Nhật ký học 28 ngày gần đây
            </h3>
          </div>
          <span className="text-xs text-[var(--ink-secondary)]">
            Học mỗi ngày để giữ ngọn lửa streak không bao giờ tắt
          </span>
        </div>

        <div className="grid grid-cols-7 sm:grid-cols-14 md:grid-cols-28 gap-1.5">
          {pastDays.map((day) => (
            <div
              key={day.dateStr}
              title={`${day.dateStr}: ${day.hasActivity ? "Đã học" : "Chưa học"}`}
              className={`aspect-square rounded-md flex flex-col items-center justify-center text-[10px] font-medium transition-all ${
                day.hasActivity
                  ? "bg-amber-500 text-white font-bold shadow-xs scale-105"
                  : day.isToday
                  ? "border-2 border-dashed border-amber-500 text-amber-500 bg-amber-500/5 animate-pulse"
                  : "bg-[var(--surface-raised)] text-[var(--ink-muted)] hover:bg-[var(--border-light)]"
              }`}
            >
              <span>{day.dayNum}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-[var(--ink-secondary)] pt-2 border-t border-[var(--border-light)]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-amber-500" />
              <span>Đã học</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[var(--surface-raised)] border border-[var(--border-medium)]" />
              <span>Nghỉ</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs border-2 border-dashed border-amber-500" />
              <span>Hôm nay</span>
            </span>
          </div>

          <span className="text-[11px] italic text-[var(--ink-muted)]">
            Học ít nhất 1 từ flashcard hoặc 1 bài quiz để được tính ngày học
          </span>
        </div>
      </div>

      {/* 4. Pet Management & Species Catalog */}
      <PetSelector
        userPets={userPets}
        speciesCatalog={speciesCatalog}
        highestStreak={highestStreak}
      />
    </div>
  );
}

