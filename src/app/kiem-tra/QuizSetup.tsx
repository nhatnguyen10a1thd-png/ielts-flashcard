"use client";

import { useState } from "react";
import { generateQuizAction, QuizQuestion } from "@/actions/quiz";
import { QuizPlayer } from "@/components/quiz/QuizPlayer";
import {
  Brain,
  Layers,
  HelpCircle,
  Keyboard,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react";

export interface TopicOption {
  id: string;
  name: string;
  wordCount: number;
}

interface QuizSetupProps {
  topics: TopicOption[];
  preselectedTopicId?: string;
  isLoggedIn: boolean;
}

export function QuizSetup({
  topics,
  preselectedTopicId,
  isLoggedIn,
}: QuizSetupProps) {
  // Setup form states
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(
    preselectedTopicId ? [preselectedTopicId] : topics.slice(0, 1).map((t) => t.id)
  );
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [poolType, setPoolType] = useState<"all" | "unknown_only">("all");
  const [mode, setMode] = useState<"multiple_choice" | "typing" | "flip_card">("multiple_choice");
  const [mcDirection, setMcDirection] = useState<"en_vi" | "vi_en">("en_vi");

  // Generated quiz state
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<QuizQuestion[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleToggleTopic = (id: string) => {
    if (selectedTopicIds.includes(id)) {
      if (selectedTopicIds.length > 1) {
        setSelectedTopicIds(selectedTopicIds.filter((t) => t !== id));
      }
    } else {
      setSelectedTopicIds([...selectedTopicIds, id]);
    }
  };

  const handleSelectAllTopics = () => {
    setSelectedTopicIds(topics.map((t) => t.id));
  };

  const handleStartQuiz = async () => {
    if (selectedTopicIds.length === 0) {
      setErrorMsg("Vui lòng chọn ít nhất một chủ đề để làm bài kiểm tra.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await generateQuizAction({
        topicIds: selectedTopicIds,
        questionCount,
        poolType,
        mode,
        direction: mcDirection,
      });

      if (!res.success || !res.questions || res.questions.length === 0) {
        setErrorMsg(res.error || "Không thể tạo bài kiểm tra với các tuỳ chọn đã chọn.");
        return;
      }

      setActiveQuizQuestions(res.questions);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tạo bài thi.");
    } finally {
      setIsLoading(false);
    }
  };

  // Nếu bài thi đang chạy, hiển thị QuizPlayer
  if (activeQuizQuestions) {
    return (
      <QuizPlayer
        mode={mode}
        topicIds={selectedTopicIds}
        initialQuestions={activeQuizQuestions}
        isLoggedIn={isLoggedIn}
        onRetake={() => setActiveQuizQuestions(null)}
      />
    );
  }

  // Màn hình thiết lập bài kiểm tra
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {errorMsg && (
        <div className="p-3 bg-[var(--wine-light)] border border-[var(--burgundy)]/30 rounded text-xs text-[var(--burgundy)] flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. Chọn phạm vi chủ đề (Một hoặc trộn nhiều chủ đề) */}
      <div className="p-6 rounded-lg bg-[var(--surface)] border border-[var(--border-light)] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-light)]">
          <div>
            <h3 className="font-serif font-bold text-sm text-[var(--ink)]">
              1. Phạm vi chủ đề kiểm tra
            </h3>
            <p className="text-[11px] text-[var(--ink-secondary)]">
              Chọn một chủ đề hoặc tích chọn nhiều chủ đề để hệ thống tự động trộn câu hỏi
            </p>
          </div>
          <button
            type="button"
            onClick={handleSelectAllTopics}
            className="text-xs text-[var(--navy)] hover:underline font-semibold"
          >
            Chọn tất cả ({topics.length})
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1">
          {topics.map((t) => {
            const isChecked = selectedTopicIds.includes(t.id);
            return (
              <label
                key={t.id}
                className={`p-3 rounded-md border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                  isChecked
                    ? "border-[var(--navy)] bg-[var(--surface-raised)] text-[var(--navy)] font-semibold"
                    : "border-[var(--border-medium)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-raised)]/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleTopic(t.id)}
                    className="rounded border-[var(--border-medium)] text-[var(--navy)] focus:ring-[var(--navy)]"
                  />
                  <span>{t.name}</span>
                </div>
                <span className="text-[11px] text-[var(--ink-muted)]">
                  {t.wordCount} từ
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 2. Chọn kiểu bài kiểm tra (3 kiểu) */}
      <div className="p-6 rounded-lg bg-[var(--surface)] border border-[var(--border-light)] shadow-xs space-y-4">
        <div className="pb-2 border-b border-[var(--border-light)]">
          <h3 className="font-serif font-bold text-sm text-[var(--ink)]">
            2. Kiểu bài kiểm tra
          </h3>
          <p className="text-[11px] text-[var(--ink-secondary)]">
            Ba hình thức luyện tập được thiết kế riêng cho việc ghi nhớ từ vựng
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Mode: Multiple Choice */}
          <button
            type="button"
            onClick={() => setMode("multiple_choice")}
            className={`p-4 rounded-lg border text-left space-y-2 transition-all ${
              mode === "multiple_choice"
                ? "border-[var(--navy)] bg-[var(--surface-raised)] ring-1 ring-[var(--navy)]"
                : "border-[var(--border-medium)] bg-[var(--surface)] hover:bg-[var(--surface-raised)]/40"
            }`}
          >
            <div className="p-2 w-8 h-8 rounded-md bg-[var(--surface)] text-[var(--navy)] flex items-center justify-center font-bold">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h4 className="font-serif font-bold text-xs text-[var(--ink)]">
              Trắc nghiệm 4 đáp án
            </h4>
            <p className="text-[11px] text-[var(--ink-secondary)] leading-relaxed">
              1 đáp án đúng, 3 đáp án nhiễu cùng loại từ. Không lặp đáp án.
            </p>
          </button>

          {/* Mode: Typing */}
          <button
            type="button"
            onClick={() => setMode("typing")}
            className={`p-4 rounded-lg border text-left space-y-2 transition-all ${
              mode === "typing"
                ? "border-[var(--navy)] bg-[var(--surface-raised)] ring-1 ring-[var(--navy)]"
                : "border-[var(--border-medium)] bg-[var(--surface)] hover:bg-[var(--surface-raised)]/40"
            }`}
          >
            <div className="p-2 w-8 h-8 rounded-md bg-[var(--surface)] text-[var(--burgundy)] flex items-center justify-center font-bold">
              <Keyboard className="w-4 h-4" />
            </div>
            <h4 className="font-serif font-bold text-xs text-[var(--ink)]">
              Gõ từ tiếng Anh
            </h4>
            <p className="text-[11px] text-[var(--ink-secondary)] leading-relaxed">
              Nhìn nghĩa tiếng Việt và gõ chính xác từ vựng (chấp nhận từ đồng nghĩa).
            </p>
          </button>

          {/* Mode: Flip Card Self Evaluation */}
          <button
            type="button"
            onClick={() => setMode("flip_card")}
            className={`p-4 rounded-lg border text-left space-y-2 transition-all ${
              mode === "flip_card"
                ? "border-[var(--navy)] bg-[var(--surface-raised)] ring-1 ring-[var(--navy)]"
                : "border-[var(--border-medium)] bg-[var(--surface)] hover:bg-[var(--surface-raised)]/40"
            }`}
          >
            <div className="p-2 w-8 h-8 rounded-md bg-[var(--surface)] text-[var(--sage)] flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <h4 className="font-serif font-bold text-xs text-[var(--ink)]">
              Lật thẻ tự đánh giá
            </h4>
            <p className="text-[11px] text-[var(--ink-secondary)] leading-relaxed">
              Xáo trộn ngẫu nhiên, tự đánh giá &quot;biết / chưa nhớ&quot; để cập nhật độ thuộc.
            </p>
          </button>
        </div>

        {/* Extra option for Multiple Choice: Direction */}
        {mode === "multiple_choice" && (
          <div className="p-3 rounded-md bg-[var(--surface-raised)]/60 border border-[var(--border-light)] flex items-center justify-between text-xs">
            <span className="text-[var(--ink-secondary)] font-medium">Chiều trắc nghiệm:</span>
            <div className="inline-flex p-1 rounded bg-[var(--surface)] border border-[var(--border-medium)]">
              <button
                type="button"
                onClick={() => setMcDirection("en_vi")}
                className={`px-2.5 py-1 rounded-xs font-semibold ${
                  mcDirection === "en_vi" ? "bg-[var(--navy)] text-[#faf7f2]" : "text-[var(--ink-secondary)]"
                }`}
              >
                Anh → Việt
              </button>
              <button
                type="button"
                onClick={() => setMcDirection("vi_en")}
                className={`px-2.5 py-1 rounded-xs font-semibold ${
                  mcDirection === "vi_en" ? "bg-[var(--navy)] text-[#faf7f2]" : "text-[var(--ink-secondary)]"
                }`}
              >
                Việt → Anh
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Số câu & Nguồn từ vựng */}
      <div className="p-6 rounded-lg bg-[var(--surface)] border border-[var(--border-light)] shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Số lượng câu */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)] mb-2">
              Số lượng câu hỏi
            </label>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {[10, 20, 50, 100].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setQuestionCount(num)}
                  className={`py-2 rounded border text-center font-semibold transition-colors ${
                    questionCount === num
                      ? "border-[var(--navy)] bg-[var(--navy)] text-[#faf7f2]"
                      : "border-[var(--border-medium)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-raised)]"
                  }`}
                >
                  {num} câu
                </button>
              ))}
            </div>
          </div>

          {/* Nguồn từ vựng */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)] mb-2">
              Nguồn từ vựng
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPoolType("all")}
                className={`py-2 px-3 rounded border text-center font-semibold transition-colors ${
                  poolType === "all"
                    ? "border-[var(--navy)] bg-[var(--navy)] text-[#faf7f2]"
                    : "border-[var(--border-medium)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-raised)]"
                }`}
              >
                Tất cả từ vựng
              </button>
              <button
                type="button"
                onClick={() => setPoolType("unknown_only")}
                className={`py-2 px-3 rounded border text-center font-semibold transition-colors ${
                  poolType === "unknown_only"
                    ? "border-[var(--burgundy)] bg-[var(--burgundy)] text-[#faf7f2]"
                    : "border-[var(--border-medium)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-raised)]"
                }`}
              >
                Chỉ từ chưa thuộc
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Start Button */}
      <button
        type="button"
        disabled={isLoading || selectedTopicIds.length === 0}
        onClick={handleStartQuiz}
        className="w-full py-3.5 rounded-lg bg-[var(--navy)] hover:bg-[var(--navy-hover)] text-[#faf7f2] font-semibold text-sm transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Brain className="w-5 h-5" />
        <span>{isLoading ? "Đang chuẩn bị câu hỏi..." : "Bắt đầu làm bài kiểm tra"}</span>
      </button>
    </div>
  );
}

