"use client";

import { useState } from "react";
import Link from "next/link";
import { StageWithProgress } from "@/actions/roadmap";
import {
  Lock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  ArrowRight,
  Flame,
  Award,
  FileCheck2,
} from "lucide-react";

interface StageCardProps {
  stage: StageWithProgress;
  type: "vocabulary" | "grammar";
  isFirst: boolean;
  isLast: boolean;
}

export function StageCard({ stage, type, isFirst, isLast }: StageCardProps) {
  const [isExpanded, setIsExpanded] = useState(stage.isUnlocked && !stage.isCompleted);

  // Status computation
  const status = stage.isCompleted
    ? "completed"
    : stage.isUnlocked
    ? "active"
    : "locked";

  return (
    <div className="relative pl-8 sm:pl-12 pb-10 last:pb-0">
      {/* Vertical Connecting Line */}
      {!isLast && (
        <div
          className={`absolute left-3.5 sm:left-5 top-10 bottom-0 w-1 transition-colors ${
            stage.isCompleted
              ? "bg-emerald-500"
              : "bg-gray-200 dark:bg-gray-700"
          }`}
        />
      )}

      {/* Node Marker */}
      <div
        className={`absolute left-0 sm:left-1.5 top-2 w-8 h-8 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs transition-transform ${
          status === "completed"
            ? "bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-950"
            : status === "active"
            ? "bg-[var(--amber)] text-white ring-4 ring-amber-100 dark:ring-amber-950 animate-pulse"
            : "bg-gray-200 dark:bg-gray-700 text-gray-400"
        }`}
      >
        {status === "completed" ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : status === "locked" ? (
          <Lock className="w-3.5 h-3.5" />
        ) : (
          <span>{stage.stageNumber}</span>
        )}
      </div>

      {/* Main Card */}
      <div
        className={`rounded-2xl border transition-all ${
          status === "completed"
            ? "bg-[var(--surface)] border-emerald-200 dark:border-emerald-800/40 shadow-xs"
            : status === "active"
            ? "bg-[var(--surface)] border-[var(--amber)] ring-1 ring-[var(--amber)] shadow-md"
            : "bg-[var(--surface-raised)]/50 border-[var(--border-light)] opacity-75"
        }`}
      >
        {/* Card Header */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--surface-raised)] border border-[var(--border-light)] text-[var(--ink-secondary)]">
                  Chặng {stage.stageNumber}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Target Band: {stage.bandRange}
                </span>
                {status === "completed" && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <Award className="w-3.5 h-3.5" />
                    Đã chinh phục
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-[var(--ink)]">
                {stage.name}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {stage.isUnlocked && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1 text-xs font-medium text-[var(--ink-secondary)] hover:text-[var(--ink)] px-3 py-1.5 rounded-lg border border-[var(--border-light)] hover:bg-[var(--surface-raised)] transition-colors"
                >
                  <span>{isExpanded ? "Thu gọn" : "Chi tiết nội dung"}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>

          {stage.description && (
            <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
              {stage.description}
            </p>
          )}

          {/* Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--ink-muted)]">
                Tiến độ: {stage.completedItems} / {stage.totalItems}{" "}
                {type === "vocabulary" ? "từ vựng đã thuộc" : "bài học hoàn thành"}
              </span>
              <span className="font-semibold text-[var(--ink)]">
                {stage.progressPercent}%
              </span>
            </div>
            <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  status === "completed"
                    ? "bg-emerald-500"
                    : "bg-[var(--amber)]"
                }`}
                style={{ width: `${stage.progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Expandable Content Area */}
        {isExpanded && stage.isUnlocked && (
          <div className="border-t border-[var(--border-light)] p-5 sm:p-6 bg-[var(--surface-raised)]/30 rounded-b-2xl space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
              {type === "vocabulary"
                ? "Danh sách Chủ đề Từ vựng trong Chặng"
                : "Danh sách Chuyên đề Ngữ pháp trong Chặng"}
            </div>

            {/* Vocab Topics */}
            {type === "vocabulary" && stage.topics && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {stage.topics.map((t) => {
                    const percent = t.wordCount > 0 ? Math.round((t.knownCount / t.wordCount) * 100) : 0;
                    const isAllKnown = t.wordCount > 0 && t.knownCount === t.wordCount;

                    return (
                      <div
                        key={t.id}
                        className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border-light)] shadow-2xs hover:border-[var(--amber)] transition-all space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="font-semibold text-sm text-[var(--ink)] flex items-center gap-1.5">
                              {isAllKnown && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                              <span>{t.name}</span>
                            </div>
                            <div className="text-xs text-[var(--ink-muted)]">
                              Đã thuộc {t.knownCount} / {t.wordCount} từ ({percent}%)
                            </div>
                          </div>
                        </div>

                        {/* Progress mini-bar */}
                        <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isAllKnown ? "bg-emerald-500" : "bg-[var(--amber)]"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                        {/* 2 Learning action buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          <Link
                            href={`/chu-de/${t.slug}`}
                            className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-[var(--navy)] text-white hover:bg-[var(--navy-hover)] transition-colors shadow-xs"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Học Flashcard</span>
                          </Link>

                          <Link
                            href={`/kiem-tra?topics=${t.id}`}
                            className="inline-flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg text-xs font-semibold border border-[var(--border-light)] bg-[var(--surface-raised)] text-[var(--ink)] hover:bg-[var(--surface-raised)]/80 transition-colors"
                            title="Luyện tập trắc nghiệm củng cố chủ đề này"
                          >
                            <span>Luyện tập</span>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Grammar Lessons */}
            {type === "grammar" && stage.lessons && (
              <div className="space-y-2.5">
                {stage.lessons.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border-light)] shadow-2xs hover:border-[var(--amber)] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          l.isCompleted
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-800"
                        }`}
                      >
                        {l.isCompleted ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <BookOpen className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-medium text-sm text-[var(--ink)]">
                          {l.title}
                        </div>
                        <div className="text-xs text-[var(--ink-muted)]">
                          Thời lượng: {l.estimatedMinutes} phút · Target Band:{" "}
                          {l.targetBand || stage.bandRange}
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/lo-trinh/ngu-phap/${l.slug}`}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        l.isCompleted
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800"
                          : "bg-[var(--navy)] text-white hover:bg-[var(--navy-hover)]"
                      }`}
                    >
                      <span>{l.isCompleted ? "Ôn lại" : "Học bài"}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>
            )}

            {/* Milestone Test Section */}
            <div
              className={`pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border ${
                stage.isEligibleForMilestone
                  ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800"
                  : "bg-[var(--surface)] border-[var(--border-light)]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    stage.isEligibleForMilestone
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                  }`}
                >
                  {stage.isEligibleForMilestone ? (
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Lock className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-[var(--ink)] flex items-center gap-1.5">
                    <span>Bài thi Đánh giá Tốt nghiệp Chặng {stage.stageNumber}</span>
                    {stage.isEligibleForMilestone ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                        Đủ điều kiện
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                        Cần thuộc ≥ {stage.requiredKnownPercent}% từ vựng
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--ink-muted)]">
                    {stage.isEligibleForMilestone
                      ? `Bạn đã đạt ${stage.progressPercent}% từ vựng thuộc. Hãy làm bài thi để tốt nghiệp chặng!`
                      : `Hiện tại bạn đạt ${stage.progressPercent}%. Hãy học các chủ đề ở trên trước khi thi tốt nghiệp.`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto">
                {stage.isEligibleForMilestone ? (
                  <Link
                    href="/de-thi"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
                  >
                    <span>Làm bài thi tốt nghiệp</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <Link
                    href="/de-thi"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border border-[var(--border-light)] text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:bg-[var(--surface-raised)] transition-colors"
                    title="Cho phép học viên giỏi thi vượt cấp ngay"
                  >
                    <span>Thi vượt cấp ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

