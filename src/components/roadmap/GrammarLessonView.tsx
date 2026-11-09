"use client";

import { useState } from "react";
import Link from "next/link";
import { GrammarLessonDetail, submitGrammarExerciseAction } from "@/actions/grammar";
import {
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Lightbulb,
  Trophy,
  RotateCcw,
} from "lucide-react";

interface GrammarLessonViewProps {
  data: GrammarLessonDetail;
}

export function GrammarLessonView({ data }: GrammarLessonViewProps) {
  const { lesson, exercises, userProgress } = data;

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    correctCount: number;
    totalQuestions: number;
    scorePercent: number;
    isCompleted: boolean;
    results: Record<
      string,
      {
        userAnswer: string;
        correctAnswer: string;
        isCorrect: boolean;
        explanation: string;
      }
    >;
  } | null>(null);

  const handleSelectOption = (exerciseId: string, option: string) => {
    if (submissionResult) return; // Không cho đổi sau khi nộp
    setAnswers((prev) => ({ ...prev, [exerciseId]: option }));
  };

  const handleTextChange = (exerciseId: string, val: string) => {
    if (submissionResult) return;
    setAnswers((prev) => ({ ...prev, [exerciseId]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await submitGrammarExerciseAction(lesson.id, answers);
      if (res.success && res.results) {
        setSubmissionResult({
          correctCount: res.correctCount,
          totalQuestions: res.totalQuestions,
          scorePercent: res.scorePercent,
          isCompleted: res.isCompleted,
          results: res.results,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmissionResult(null);
    setAnswers({});
  };

  const allAnswered = exercises.every(
    (ex) => (answers[ex.id] || "").trim().length > 0
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Link */}
      <Link
        href="/lo-trinh?tab=ngu-phap"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ink-secondary)] hover:text-[var(--navy)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Quay lại Lộ trình Ngữ pháp</span>
      </Link>

      {/* Lesson Header */}
      <div className="space-y-3 p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border-light)] shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {lesson.stageName && (
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[var(--surface-raised)] border border-[var(--border-light)] text-[var(--ink-secondary)]">
              {lesson.stageName}
            </span>
          )}
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Target: {lesson.targetBand || "Band 6.0+"}
          </span>
          <span className="text-xs text-[var(--ink-muted)]">
            Thời lượng: ~{lesson.estimatedMinutes} phút
          </span>
          {userProgress?.isCompleted && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Đã hoàn thành bài học
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--ink)]">
          {lesson.title}
        </h1>
        <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
          {lesson.summary}
        </p>
      </div>

      {/* Theory Content Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border-light)] shadow-xs space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-[var(--border-light)] text-base font-bold font-serif text-[var(--ink)]">
          <BookOpen className="w-5 h-5 text-[var(--navy)]" />
          <span>Lý thuyết & Ví dụ thực chiến IELTS</span>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed text-[var(--ink)] space-y-4">
          <div className="whitespace-pre-line leading-relaxed font-sans text-sm sm:text-base">
            {lesson.theoryMarkdown}
          </div>
        </div>

        {lesson.tips && (
          <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Mẹo thi cử & Lưu ý quan trọng
              </div>
              <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
                {lesson.tips}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Exercises Section */}
      {exercises.length > 0 && (
        <div className="p-6 sm:p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border-light)] shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border-light)]">
            <div className="flex items-center gap-2 text-base font-bold font-serif text-[var(--ink)]">
              <Sparkles className="w-5 h-5 text-[var(--amber)]" />
              <span>Bài tập thực hành tương tác ({exercises.length} câu)</span>
            </div>

            {submissionResult && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--ink-secondary)] hover:text-[var(--navy)]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Làm lại</span>
              </button>
            )}
          </div>

          {/* Submission Result Banner */}
          {submissionResult && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                submissionResult.isCompleted
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                  : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 shrink-0" />
                <div>
                  <div className="font-bold text-sm">
                    {submissionResult.isCompleted
                      ? "Chúc mừng! Bạn đã hoàn thành xuất sắc bài học này!"
                      : "Bạn chưa đạt điều kiện hoàn thành bài học (cần ≥ 70%)."}
                  </div>
                  <div className="text-xs opacity-90">
                    Kết quả: {submissionResult.correctCount} /{" "}
                    {submissionResult.totalQuestions} câu đúng (
                    {submissionResult.scorePercent}%)
                  </div>
                </div>
              </div>

              <Link
                href="/lo-trinh?tab=ngu-phap"
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[var(--navy)] text-white hover:bg-[var(--navy-hover)] shrink-0 transition-colors"
              >
                Tiếp tục lộ trình
              </Link>
            </div>
          )}

          {/* Form with Questions */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {exercises.map((ex, index) => {
              const res = submissionResult?.results[ex.id];
              const isAnswered = Boolean(answers[ex.id]);

              return (
                <div
                  key={ex.id}
                  className={`p-4 sm:p-5 rounded-xl border transition-all ${
                    res
                      ? res.isCorrect
                        ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800"
                        : "bg-red-50/40 dark:bg-red-950/20 border-red-300 dark:border-red-800"
                      : "bg-[var(--surface-raised)]/40 border-[var(--border-light)]"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-sm sm:text-base text-[var(--ink)] leading-snug">
                        <span className="text-[var(--amber-dark)] font-bold mr-1.5">
                          Câu {index + 1}:
                        </span>
                        {ex.question}
                      </div>

                      {res && (
                        <div className="shrink-0">
                          {res.isCorrect ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Đúng
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 dark:bg-red-950 px-2 py-0.5 rounded-full">
                              <XCircle className="w-3.5 h-3.5" /> Sai
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Options (Multiple choice) */}
                    {ex.questionType === "multiple_choice" && ex.options.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {ex.options.map((opt) => {
                          const isSelected = answers[ex.id] === opt;
                          const isCorrectOption =
                            res && res.correctAnswer.toLowerCase() === opt.toLowerCase();

                          let optionStyle =
                            "border-[var(--border-light)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--amber)]";

                          if (res) {
                            if (isCorrectOption) {
                              optionStyle =
                                "border-emerald-500 bg-emerald-100/70 text-emerald-900 font-semibold";
                            } else if (isSelected && !res.isCorrect) {
                              optionStyle =
                                "border-red-500 bg-red-100/70 text-red-900 line-through";
                            } else {
                              optionStyle = "opacity-60 border-[var(--border-light)]";
                            }
                          } else if (isSelected) {
                            optionStyle =
                              "border-[var(--navy)] bg-[var(--surface-raised)] text-[var(--navy)] font-semibold ring-1 ring-[var(--navy)]";
                          }

                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleSelectOption(ex.id, opt)}
                              disabled={Boolean(submissionResult)}
                              className={`p-3 rounded-xl border text-left text-sm transition-all flex items-center justify-between ${optionStyle}`}
                            >
                              <span>{opt}</span>
                              {isSelected && !res && (
                                <div className="w-2 h-2 rounded-full bg-[var(--navy)]" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      // Fill in blank
                      <div className="pt-1">
                        <input
                          type="text"
                          value={answers[ex.id] || ""}
                          onChange={(e) => handleTextChange(ex.id, e.target.value)}
                          disabled={Boolean(submissionResult)}
                          placeholder="Nhập câu trả lời của bạn..."
                          className="w-full sm:w-96 px-4 py-2.5 rounded-xl border border-[var(--border-light)] bg-[var(--surface)] text-sm text-[var(--ink)] focus:outline-hidden focus:border-[var(--navy)]"
                        />
                      </div>
                    )}

                    {/* Detailed Explanation Box (Study4-style) */}
                    {res && (
                      <div className="mt-3 p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border-light)] text-xs text-[var(--ink-secondary)] space-y-1">
                        <div className="font-bold text-[var(--navy)] flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Giải thích chi tiết:</span>
                        </div>
                        <div className="leading-relaxed pl-4">
                          {res.explanation}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {!submissionResult && (
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={!allAnswered || isSubmitting}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-xs ${
                    allAnswered && !isSubmitting
                      ? "bg-[var(--navy)] hover:bg-[var(--navy-hover)] cursor-pointer"
                      : "bg-gray-400 cursor-not-allowed opacity-60"
                  }`}
                >
                  {isSubmitting ? "Đang chấm điểm..." : "Kiểm tra đáp án"}
                </button>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}

