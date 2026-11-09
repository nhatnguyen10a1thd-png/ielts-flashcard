"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { submitTestExamAction } from "@/actions/test";
import {
  Clock,
  Flag,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Send,
  BookOpen,
} from "lucide-react";

interface ExamQuestion {
  id: string;
  partNumber: number;
  contextText: string | null;
  questionText: string;
  questionType: "multiple_choice" | "fill_blank";
  options: string[];
  sortOrder: number;
}

interface ExamRoomProps {
  test: {
    id: string;
    title: string;
    slug: string;
    durationMinutes: number;
    totalQuestions: number;
  };
  questions: ExamQuestion[];
}

export function ExamRoom({ test, questions }: ExamRoomProps) {
  const router = useRouter();

  // Answers & flags
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  // Timer: durationMinutes * 60 seconds
  const totalSeconds = test.durationMinutes * 60;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const startTimeRef = useRef(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-submit when time is up
  const handleSubmitExam = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const timeSpent = Math.min(
      totalSeconds,
      Math.round((Date.now() - startTimeRef.current) / 1000)
    );

    try {
      const res = await submitTestExamAction(test.id, answers, timeSpent);
      if (res.success && res.submissionId) {
        router.push(`/de-thi/${test.slug}/ket-qua/${res.submissionId}`);
      } else {
        alert(res.error || "Có lỗi khi nộp bài thi.");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối khi nộp bài.");
      setIsSubmitting(false);
    }
  };

  // Countdown timer effect
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const currentQ = questions[currentIndex];
  const answeredCount = Object.values(answers).filter((a) => a.trim().length > 0).length;
  const unansweredCount = questions.length - answeredCount;
  const isTimeWarning = timeLeft <= 180; // Dưới 3 phút

  const toggleFlag = (qId: string) => {
    setFlagged((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleSelectOption = (opt: string) => {
    setAnswers((prev) => ({ ...prev, [currentQ.id]: opt }));
  };

  const handleTextChange = (val: string) => {
    setAnswers((prev) => ({ ...prev, [currentQ.id]: val }));
  };

  return (
    <div className="min-h-screen pb-16 space-y-6">
      {/* Sticky Exam Top Bar */}
      <header className="sticky top-0 z-30 w-full border-b border-[var(--border-light)] bg-[var(--canvas)]/95 backdrop-blur-md shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="font-serif font-bold text-sm sm:text-base text-[var(--ink)] truncate max-w-xs sm:max-w-md">
              {test.title}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Timer Badge */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-mono font-bold transition-colors ${
                isTimeWarning
                  ? "bg-red-50 text-red-600 border-red-300 dark:bg-red-950 dark:border-red-800 animate-pulse"
                  : "bg-[var(--surface-raised)] border-[var(--border-light)] text-[var(--ink)]"
              }`}
            >
              <Clock className="w-4 h-4 text-amber-500" />
              <span>{formatTime(timeLeft)}</span>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Nộp bài</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main 2-Column Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Current Question Display (Cols 1-8) */}
        <div className="lg:col-span-8 space-y-6">
          {currentQ && (
            <div className="p-6 sm:p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border-light)] shadow-xs space-y-6">
              {/* Question Navigation Bar inside card */}
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-light)] text-xs text-[var(--ink-secondary)]">
                <span className="font-bold text-[var(--navy)] text-sm">
                  Câu {currentIndex + 1} / {questions.length} (Phần {currentQ.partNumber})
                </span>

                <button
                  type="button"
                  onClick={() => toggleFlag(currentQ.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors ${
                    flagged[currentQ.id]
                      ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-700"
                      : "bg-[var(--surface-raised)] text-[var(--ink-secondary)] border-[var(--border-light)] hover:text-[var(--ink)]"
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{flagged[currentQ.id] ? "Đã gắn cờ" : "Gắn cờ xem lại"}</span>
                </button>
              </div>

              {/* Context Reading Passage (if any) */}
              {currentQ.contextText && (
                <div className="p-4 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                    <BookOpen className="w-4 h-4 text-amber-600" />
                    <span>Đoạn văn đọc hiểu / Ngữ cảnh:</span>
                  </div>
                  <div className="text-xs sm:text-sm text-[var(--ink)] leading-relaxed whitespace-pre-line font-serif">
                    {currentQ.contextText}
                  </div>
                </div>
              )}

              {/* Question Text */}
              <div className="space-y-2">
                <div className="text-base sm:text-lg font-medium text-[var(--ink)] leading-relaxed">
                  {currentQ.questionText}
                </div>
              </div>

              {/* Options */}
              {currentQ.questionType === "multiple_choice" && currentQ.options.length > 0 ? (
                <div className="space-y-2.5 pt-2">
                  {currentQ.options.map((opt, i) => {
                    const optionLetter = String.fromCharCode(65 + i); // A, B, C, D
                    const isSelected = answers[currentQ.id] === opt;

                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleSelectOption(opt)}
                        className={`w-full p-4 rounded-xl border text-left text-sm transition-all flex items-center gap-3 ${
                          isSelected
                            ? "bg-[var(--surface-raised)] border-[var(--navy)] text-[var(--navy)] font-semibold ring-1 ring-[var(--navy)] shadow-xs"
                            : "bg-[var(--surface)] border-[var(--border-light)] text-[var(--ink)] hover:border-[var(--amber)] hover:bg-[var(--surface-raised)]/50"
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? "bg-[var(--navy)] text-white"
                              : "bg-[var(--surface-raised)] text-[var(--ink-secondary)]"
                          }`}
                        >
                          {optionLetter}
                        </span>
                        <span className="leading-snug">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="pt-2">
                  <input
                    type="text"
                    value={answers[currentQ.id] || ""}
                    onChange={(e) => handleTextChange(e.target.value)}
                    placeholder="Nhập câu trả lời của bạn..."
                    className="w-full px-4 py-3 rounded-xl border border-[var(--border-light)] bg-[var(--surface)] text-sm text-[var(--ink)] focus:outline-hidden focus:border-[var(--navy)]"
                  />
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="pt-6 border-t border-[var(--border-light)] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                    currentIndex === 0
                      ? "opacity-40 cursor-not-allowed text-[var(--ink-muted)]"
                      : "bg-[var(--surface-raised)] text-[var(--ink)] hover:bg-[var(--surface-raised)]/80 border border-[var(--border-light)]"
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Câu trước</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))
                  }
                  disabled={currentIndex === questions.length - 1}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                    currentIndex === questions.length - 1
                      ? "opacity-40 cursor-not-allowed text-[var(--ink-muted)]"
                      : "bg-[var(--navy)] text-white hover:bg-[var(--navy-hover)]"
                  }`}
                >
                  <span>Câu tiếp theo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Question Palette (Study4-style) (Cols 9-12) */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="sticky top-24 p-5 sm:p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border-light)] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-light)]">
              <span className="font-serif font-bold text-sm text-[var(--ink)]">
                Bảng câu hỏi ({answeredCount}/{questions.length} đã làm)
              </span>
            </div>

            {/* Color Legend */}
            <div className="flex items-center justify-between text-[11px] text-[var(--ink-muted)] px-1">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-emerald-600" />
                <span>Đã làm</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-700" />
                <span>Chưa làm</span>
              </div>
              <div className="flex items-center gap-1">
                <Flag className="w-3 h-3 text-amber-500" />
                <span>Gắn cờ</span>
              </div>
            </div>

            {/* Question Grid */}
            <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2 pt-1 max-h-80 overflow-y-auto p-1">
              {questions.map((q, idx) => {
                const isAnswered = Boolean((answers[q.id] || "").trim());
                const isFlagged = Boolean(flagged[q.id]);
                const isCurrent = idx === currentIndex;

                let btnStyle = "bg-gray-100 dark:bg-gray-800 text-[var(--ink-secondary)]";

                if (isAnswered) {
                  btnStyle = "bg-emerald-600 text-white font-bold";
                }

                if (isCurrent) {
                  btnStyle += " ring-2 ring-[var(--navy)] ring-offset-2";
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative h-10 rounded-xl text-xs font-semibold flex items-center justify-center transition-all hover:scale-105 ${btnStyle}`}
                  >
                    <span>{idx + 1}</span>
                    {isFlagged && (
                      <Flag className="w-2.5 h-2.5 text-amber-300 absolute top-1 right-1 fill-amber-300" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Submit CTA */}
            <div className="pt-3 border-t border-[var(--border-light)]">
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>Nộp bài thi</span>
              </button>
            </div>
          </div>
        </aside>
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[var(--surface)] border border-[var(--border-light)] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-[var(--navy)]">
              <HelpCircle className="w-6 h-6 text-amber-500" />
              <h3 className="text-lg font-serif font-bold text-[var(--ink)]">
                Xác nhận nộp bài thi
              </h3>
            </div>

            <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
              Bạn đã hoàn thành <strong>{answeredCount} / {questions.length}</strong> câu hỏi.
              {unansweredCount > 0 ? (
                <span className="block mt-2 text-amber-600 dark:text-amber-400 font-semibold">
                  ⚠️ Bạn vẫn còn {unansweredCount} câu chưa trả lời. Bạn có chắc chắn muốn nộp bài ngay bây giờ?
                </span>
              ) : (
                <span className="block mt-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                  ✓ Bạn đã trả lời toàn bộ câu hỏi trong đề thi!
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-[var(--border-light)] text-[var(--ink-secondary)] hover:bg-[var(--surface-raised)]"
              >
                Tiếp tục làm bài
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  handleSubmitExam();
                }}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              >
                {isSubmitting ? "Đang nộp..." : "Xác nhận nộp"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

