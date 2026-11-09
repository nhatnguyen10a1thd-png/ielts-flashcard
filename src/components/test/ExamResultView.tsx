"use client";

import Link from "next/link";
import { OwlMascot } from "@/components/owl/OwlMascot";
import {
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  BookOpen,
  Award,
} from "lucide-react";

interface ExamResultViewProps {
  data: {
    submission: {
      id: string;
      timeSpentSeconds: number;
      totalCorrect: number;
      totalQuestions: number;
      scorePercent: number;
      estimatedBand: number;
      submittedAt: Date;
    };
    test: {
      id: string;
      title: string;
      slug: string;
    };
    questions: Array<{
      id: string;
      partNumber: number;
      contextText: string | null;
      questionText: string;
      questionType: "multiple_choice" | "fill_blank";
      options: string[];
      correctAnswer: string;
      explanation: string;
      sortOrder: number;
      userAnswer: string;
      isCorrect: boolean;
    }>;
    feedback: {
      band: number;
      cefrLevel: string;
      title: string;
      evaluation: string;
      advice: string;
    };
  };
}

export function ExamResultView({ data }: ExamResultViewProps) {
  const { submission, test, questions, feedback } = data;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m} phút ${s} giây`;
  };

  const scrollToQuestion = (qId: string) => {
    const el = document.getElementById(`review-q-${qId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Score Summary Card */}
      <div className="relative overflow-hidden rounded-2xl bg-[var(--surface)] border border-[var(--border-light)] p-6 sm:p-8 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <OwlMascot variant="celebrating" size={76} />
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--surface-raised)] border border-[var(--border-light)] text-[var(--ink-secondary)]">
                Kết quả khảo thí
              </span>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-[var(--ink)]">
                {test.title}
              </h1>
              <p className="text-xs text-[var(--ink-muted)]">
                Thời gian làm bài: {formatTime(submission.timeSpentSeconds)}
              </p>
            </div>
          </div>

          {/* IELTS Band Badge */}
          <div className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/20 border border-amber-300 dark:border-amber-800 text-center min-w-44 shrink-0 shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Ước tính Điểm IELTS
            </div>
            <div className="text-3xl sm:text-4xl font-serif font-black text-amber-700 dark:text-amber-200">
              Band {submission.estimatedBand.toFixed(1)}
            </div>
            <div className="text-xs font-semibold text-amber-900 dark:text-amber-300">
              Cấp độ: {feedback.cefrLevel} ({feedback.title})
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[var(--surface-raised)]/60 border border-[var(--border-light)] text-center">
          <div>
            <div className="text-xs text-[var(--ink-muted)]">Số câu đúng</div>
            <div className="text-base sm:text-lg font-bold text-emerald-600">
              {submission.totalCorrect} / {submission.totalQuestions}
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--ink-muted)]">Tỷ lệ chính xác</div>
            <div className="text-base sm:text-lg font-bold text-[var(--navy)]">
              {submission.scorePercent}%
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--ink-muted)]">Số câu sai / bỏ</div>
            <div className="text-base sm:text-lg font-bold text-red-600">
              {submission.totalQuestions - submission.totalCorrect}
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--ink-muted)]">Thời lượng</div>
            <div className="text-base sm:text-lg font-bold text-[var(--ink)]">
              {formatTime(submission.timeSpentSeconds)}
            </div>
          </div>
        </div>

        {/* Owl Evaluation & Advice */}
        <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 space-y-2 text-xs sm:text-sm">
          <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Đánh giá & Lời khuyên từ Cú Tri Thức:</span>
          </div>
          <p className="text-[var(--ink)] leading-relaxed">
            {feedback.evaluation}
          </p>
          <p className="text-[var(--ink-secondary)] font-medium leading-relaxed">
            💡 {feedback.advice}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Link
            href={`/de-thi/${test.slug}/lam-bai`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-[var(--border-light)] text-[var(--ink)] hover:bg-[var(--surface-raised)] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Làm lại đề thi</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/de-thi"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-[var(--border-light)] bg-[var(--surface-raised)] text-[var(--ink)] hover:bg-[var(--surface-raised)]/80 transition-colors"
            >
              <span>Kho Đề thi khác</span>
            </Link>

            <Link
              href="/lo-trinh"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[var(--navy)] text-white hover:bg-[var(--navy-hover)] transition-colors shadow-xs"
            >
              <span>Vào Lộ trình học</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Review Jump Palette (Study4-style) */}
      <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border-light)] shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-[var(--ink)]">
          <span>Bảng kiểm tra nhanh kết quả từng câu:</span>
          <div className="flex items-center gap-3 text-[11px] font-normal text-[var(--ink-muted)]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" /> Đúng ({submission.totalCorrect})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" /> Sai ({submission.totalQuestions - submission.totalCorrect})
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              type="button"
              onClick={() => scrollToQuestion(q.id)}
              className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all hover:scale-105 ${
                q.isCorrect
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                  : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-800"
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Question by Question Detailed Review with Explanations */}
      <div className="space-y-6">
        <h2 className="font-serif font-bold text-lg text-[var(--ink)] flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[var(--navy)]" />
          <span>Chi tiết Lời giải & Giải thích từng câu hỏi</span>
        </h2>

        {questions.map((q, idx) => (
          <div
            key={q.id}
            id={`review-q-${q.id}`}
            className={`p-6 rounded-2xl border transition-all ${
              q.isCorrect
                ? "bg-[var(--surface)] border-emerald-200 dark:border-emerald-800/40"
                : "bg-[var(--surface)] border-red-200 dark:border-red-800/40"
            }`}
          >
            <div className="space-y-4">
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--border-light)]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[var(--surface-raised)] border border-[var(--border-light)] text-[var(--ink-secondary)]">
                    Câu {idx + 1}
                  </span>
                  <span className="text-xs text-[var(--ink-muted)]">
                    Phần {q.partNumber}
                  </span>
                </div>

                {q.isCorrect ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đúng
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950 px-2.5 py-1 rounded-full border border-red-200 dark:border-red-800">
                    <XCircle className="w-3.5 h-3.5" /> Chưa chính xác
                  </span>
                )}
              </div>

              {/* Context text if any */}
              {q.contextText && (
                <div className="p-3.5 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/40 text-xs text-[var(--ink)] font-serif whitespace-pre-line leading-relaxed">
                  {q.contextText}
                </div>
              )}

              {/* Question Text */}
              <div className="text-sm sm:text-base font-semibold text-[var(--ink)] leading-snug">
                {q.questionText}
              </div>

              {/* Answers Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                <div
                  className={`p-3 rounded-xl border ${
                    q.isCorrect
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                      : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200"
                  }`}
                >
                  <div className="font-semibold text-[10px] uppercase opacity-75">
                    Câu trả lời của bạn:
                  </div>
                  <div className="font-bold text-sm mt-0.5">
                    {q.userAnswer || "(Bỏ trống / Chưa trả lời)"}
                  </div>
                </div>

                <div className="p-3 rounded-xl border bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                  <div className="font-semibold text-[10px] uppercase opacity-75">
                    Đáp án chính xác:
                  </div>
                  <div className="font-bold text-sm mt-0.5">
                    {q.correctAnswer}
                  </div>
                </div>
              </div>

              {/* Study4-style Detailed Explanation Box */}
              <div className="p-4 rounded-xl bg-[var(--surface-raised)]/70 border border-[var(--border-light)] text-xs text-[var(--ink-secondary)] space-y-1.5">
                <div className="font-bold text-[var(--navy)] flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-[var(--amber)]" />
                  <span>Giải thích chi tiết (Detailed Explanation):</span>
                </div>
                <div className="leading-relaxed pl-5 text-[var(--ink)]">
                  {q.explanation}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
