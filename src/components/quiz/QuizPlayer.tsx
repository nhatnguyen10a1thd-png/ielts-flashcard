"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { QuizQuestion, submitQuizAction, QuizSubmissionAnswer } from "@/actions/quiz";
import { checkTypingAnswer } from "@/lib/quiz/random-sampler";
import { speakEnglishWord } from "@/lib/speech/speaker";
import { OwlMascot } from "@/components/owl/OwlMascot";
import {
  Volume2,
  CheckCircle2,
  XCircle,
  RotateCw,
  ArrowRight,
  Brain,
  Clock,
  Sparkles,
  Award,
  BookOpen,
  ArrowLeft,
  GraduationCap,
} from "lucide-react";

interface QuizPlayerProps {
  mode: "flip_card" | "multiple_choice" | "typing";
  topicIds: string[];
  initialQuestions: QuizQuestion[];
  isLoggedIn: boolean;
  onRetake: () => void;
}

export function QuizPlayer({
  mode,
  topicIds,
  initialQuestions,
  isLoggedIn,
  onRetake,
}: QuizPlayerProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>(initialQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizSubmissionAnswer[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedAttemptId, setSavedAttemptId] = useState<string | null>(null);

  // Timer
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Mode 1: Flip card state
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Mode 2: Multiple choice state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

  // Mode 3: Typing state
  const [typingInput, setTypingInput] = useState("");
  const [typingFeedback, setTypingFeedback] = useState<{
    submitted: boolean;
    isCorrect: boolean;
    correctAnswer: string;
    matchedSynonym?: string;
  } | null>(null);

  const currentQ = questions[currentIndex];

  // Khởi động bộ đếm thời gian
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Format thời gian làm bài mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  // Hoàn thành bài kiểm tra và nộp kết quả
  const handleFinishQuiz = useCallback(
    async (finalAnswers: QuizSubmissionAnswer[]) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsFinished(true);

      const correctCount = finalAnswers.filter((a) => a.isCorrect).length;

      if (isLoggedIn) {
        setIsSubmitting(true);
        try {
          const res = await submitQuizAction({
            mode,
            topicIds,
            totalQuestions: finalAnswers.length,
            correctAnswers: correctCount,
            timeSpentSeconds: secondsElapsed,
            answers: finalAnswers,
          });
          if (res.success && res.attemptId) {
            setSavedAttemptId(res.attemptId);
          }
        } catch (err) {
          console.error("Lỗi khi nộp bài:", err);
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [isLoggedIn, mode, topicIds, secondsElapsed]
  );

  // Chuyển sang câu tiếp theo
  const advanceToNext = useCallback(
    (record: QuizSubmissionAnswer) => {
      const updatedAnswers = [...answers, record];
      setAnswers(updatedAnswers);

      if (currentIndex < questions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setIsCardFlipped(false);
        setSelectedOption(null);
        setIsAnswerRevealed(false);
        setTypingInput("");
        setTypingFeedback(null);
      } else {
        handleFinishQuiz(updatedAnswers);
      }
    },
    [answers, currentIndex, questions.length, handleFinishQuiz]
  );

  // Xử lý chế độ 1: Lật thẻ tự đánh giá
  const handleFlipSelfEvaluate = (isKnown: boolean) => {
    if (!currentQ) return;
    advanceToNext({
      wordId: currentQ.wordId,
      userAnswer: isKnown ? "Đã thuộc" : "Chưa thuộc",
      correctAnswer: currentQ.correctAnswer,
      isCorrect: isKnown,
    });
  };

  // Xử lý chế độ 2: Trắc nghiệm 4 đáp án
  const handleOptionSelect = useCallback(
    (option: string) => {
      if (isAnswerRevealed || !currentQ) return;
      setSelectedOption(option);
      setIsAnswerRevealed(true);

      const isCorrect = option === currentQ.correctAnswer;

      // Chờ 800ms để người học kịp nhìn đáp án trước khi tự chuyển câu
      setTimeout(() => {
        advanceToNext({
          wordId: currentQ.wordId,
          userAnswer: option,
          correctAnswer: currentQ.correctAnswer,
          isCorrect,
        });
      }, 800);
    },
    [isAnswerRevealed, currentQ, advanceToNext]
  );

  // Phím tắt bàn phím cho Trắc nghiệm (1-4 hoặc A-D) để thao tác cực nhanh không trễ
  useEffect(() => {
    if (mode !== "multiple_choice" || isAnswerRevealed || !currentQ || isFinished) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toUpperCase();
      let selectedIdx = -1;
      if (key === "1" || key === "A") selectedIdx = 0;
      else if (key === "2" || key === "B") selectedIdx = 1;
      else if (key === "3" || key === "C") selectedIdx = 2;
      else if (key === "4" || key === "D") selectedIdx = 3;

      if (selectedIdx >= 0 && currentQ.options && currentQ.options[selectedIdx]) {
        e.preventDefault();
        handleOptionSelect(currentQ.options[selectedIdx]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, isAnswerRevealed, currentQ, isFinished, handleOptionSelect]);

  // Xử lý chế độ 3: Gõ từ tiếng Anh
  const handleTypingSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentQ || typingFeedback?.submitted) return;

    const evaluation = checkTypingAnswer({
      userInput: typingInput,
      correctWord: {
        id: currentQ.wordId,
        topicId: "",
        word: currentQ.word,
        wordNormalized: currentQ.word.toLowerCase().trim(),
        partOfSpeech: currentQ.partOfSpeech,
        meaning: currentQ.meaning,
        pronunciation: currentQ.pronunciation,
        synonyms: currentQ.synonyms,
      },
    });

    setTypingFeedback({
      submitted: true,
      isCorrect: evaluation.isCorrect,
      correctAnswer: currentQ.word,
      matchedSynonym: evaluation.matchedSynonym,
    });
  };

  const handleTypingNext = () => {
    if (!currentQ || !typingFeedback) return;
    advanceToNext({
      wordId: currentQ.wordId,
      userAnswer: typingInput.trim(),
      correctAnswer: currentQ.correctAnswer,
      isCorrect: typingFeedback.isCorrect,
    });
  };

  // MÀN HÌNH KẾT QUẢ
  if (isFinished) {
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const totalCount = questions.length;
    const percent = Math.round((correctCount / totalCount) * 100);
    const wrongAnswers = answers.filter((a) => !a.isCorrect);

    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Result Header Card with Owl Evaluation */}
        <div className="p-8 sm:p-10 rounded-2xl bg-[var(--surface)] border border-[var(--border-light)] text-center space-y-6 shadow-md">
          <div className="relative inline-block mx-auto">
            {percent >= 80 ? (
              <OwlMascot variant="celebrating" size={110} />
            ) : percent >= 50 ? (
              <OwlMascot variant="studious" size={105} />
            ) : (
              <OwlMascot variant="thinking" size={105} />
            )}
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[var(--amber)] text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-xs uppercase tracking-wider">
              {percent >= 80 ? "Xuất sắc" : percent >= 50 ? "Khá tốt" : "Cần ôn luyện"}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--amber)]">
              Đánh giá từ Cú Giám Thị
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--ink)]">
              {percent >= 80
                ? "Thần tốc và sắc bén! Bạn đã làm chủ bộ từ vựng này."
                : percent >= 50
                ? "Nỗ lực đáng ghi nhận! Hãy ôn lại các từ chưa đúng để đạt 100%."
                : "Kiên trì là chìa khóa! Cú sẽ đồng hành cùng bạn ôn luyện lại."}
            </h2>
          </div>

          {/* 3 Metric Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-2">
            <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-medium)]">
              <span className="block text-2xl font-serif font-bold text-[var(--ink)]">
                {correctCount} / {totalCount}
              </span>
              <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-secondary)]">
                Số câu đúng
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-medium)]">
              <span className={`block text-2xl font-serif font-bold ${percent >= 70 ? "text-[var(--sage)]" : "text-[var(--burgundy)]"}`}>
                {percent}%
              </span>
              <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-secondary)]">
                Độ chính xác
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-medium)]">
              <span className="block text-2xl font-serif font-bold text-[var(--ink)]">
                {formatTime(secondsElapsed)}
              </span>
              <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-secondary)]">
                Thời gian làm
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-[var(--border-light)]">
            <button
              onClick={onRetake}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-md bg-[var(--navy)] text-[#faf7f2] hover:bg-[var(--navy-hover)] text-xs font-semibold shadow-xs transition-colors"
            >
              <RotateCw className="w-4 h-4" />
              <span>Làm bài kiểm tra khác</span>
            </button>

            {isLoggedIn && (
              <Link
                href="/lich-su"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-md border border-[var(--border-medium)] bg-[var(--surface)] hover:bg-[var(--surface-raised)] text-[var(--ink)] text-xs font-semibold transition-colors"
              >
                <span>Xem lịch sử điểm số</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* List of Wrong Questions if any */}
        {wrongAnswers.length > 0 && (
          <div className="bg-[var(--surface)] border border-[var(--border-light)] rounded-lg overflow-hidden shadow-xs space-y-4 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-light)]">
              <div>
                <h3 className="font-serif font-bold text-base text-[var(--burgundy)]">
                  Các từ trả lời chưa chính xác ({wrongAnswers.length} từ)
                </h3>
                <p className="text-xs text-[var(--ink-secondary)]">
                  Hãy ghi nhớ lại nghĩa và cách viết đúng của các từ dưới đây
                </p>
              </div>
            </div>

            <div className="divide-y divide-[var(--border-light)]">
              {wrongAnswers.map((item, idx) => {
                const q = questions.find((q) => q.wordId === item.wordId);
                if (!q) return null;

                return (
                  <div key={idx} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-sm text-[var(--ink)]">
                          {q.word}
                        </span>
                        {q.partOfSpeech && (
                          <span className="text-[11px] font-serif italic text-[var(--ink-secondary)]">
                            ({q.partOfSpeech})
                          </span>
                        )}
                        <button
                          onClick={() => speakEnglishWord(q.word)}
                          className="p-1 text-[var(--ink-muted)] hover:text-[var(--navy)] rounded"
                          title="Nghe phát âm"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-[var(--ink)] font-medium">
                        Nghĩa đúng: <span className="text-[var(--sage)]">{q.meaning}</span>
                      </p>
                      {item.userAnswer && (
                        <p className="text-[11px] text-[var(--burgundy)]">
                          Bạn đã trả lời: <s>{item.userAnswer}</s>
                        </p>
                      )}
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

  // MÀN HÌNH ĐANG LÀM BÀI THI
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Top Header with Owl Proctor Mascot */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border-light)] shadow-xs">
        <div className="flex items-center gap-2.5">
          <OwlMascot variant="badge" size={32} />
          <div>
            <span className="block text-xs font-semibold text-[var(--ink)]">
              Cú Giám Thị • Câu {currentIndex + 1} / {questions.length}
            </span>
            <span className="text-[10px] text-[var(--ink-muted)]">
              {mode === "multiple_choice"
                ? "Trắc nghiệm 4 đáp án (Phím 1-4 hoặc A-D)"
                : mode === "typing"
                ? "Gõ từ vựng tiếng Anh chính xác"
                : "Lật thẻ tự đánh giá độ thuộc"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-[var(--surface-raised)] border border-[var(--border-medium)] text-[var(--ink)]">
          <Clock className="w-3.5 h-3.5 text-[var(--amber)]" />
          <span>{formatTime(secondsElapsed)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 rounded-full bg-[var(--border-medium)] overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[var(--navy)] to-[var(--amber)] transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* MODE 1: LẬT THẺ TỰ ĐÁNH GIÁ */}
      {mode === "flip_card" && currentQ && (
        <div className="space-y-6">
          <div
            onClick={() => setIsCardFlipped(!isCardFlipped)}
            className="p-10 rounded-xl bg-[var(--surface)] border border-[var(--border-medium)] shadow-sm text-center min-h-[260px] flex flex-col justify-between cursor-pointer select-none"
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
              {isCardFlipped ? "Đáp án" : "Từ vựng"}
            </div>

            <div className="my-auto space-y-3">
              {!isCardFlipped ? (
                <>
                  <h3 className="text-3xl font-serif font-bold text-[var(--ink)]">
                    {currentQ.word}
                  </h3>
                  {currentQ.partOfSpeech && (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-serif italic bg-[var(--surface-raised)] text-[var(--ink-secondary)]">
                      {currentQ.partOfSpeech}
                    </span>
                  )}
                  {currentQ.pronunciation && (
                    <p className="text-xs font-mono text-[var(--ink-secondary)]">
                      {currentQ.pronunciation}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-serif font-bold text-[var(--ink)]">
                    {currentQ.meaning}
                  </h3>
                  {currentQ.synonyms && currentQ.synonyms.length > 0 && (
                    <p className="text-xs text-[var(--ink-muted)]">
                      Đồng nghĩa: {currentQ.synonyms.join(", ")}
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="text-[11px] text-[var(--ink-muted)]">
              {isCardFlipped ? "Nhấn để lật lại mặt trước" : "Nhấn vào thẻ hoặc nhấn nút bên dưới để xem nghĩa"}
            </div>
          </div>

          {!isCardFlipped ? (
            <button
              onClick={() => setIsCardFlipped(true)}
              className="w-full py-3 rounded-lg bg-[var(--navy)] text-[#faf7f2] hover:bg-[var(--navy-hover)] text-xs font-semibold transition-colors shadow-xs"
            >
              Lật xem đáp án
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleFlipSelfEvaluate(false)}
                className="py-3 px-4 rounded-lg border border-[var(--burgundy)]/40 bg-[var(--wine-light)] text-[var(--burgundy)] text-xs font-semibold hover:bg-[var(--burgundy)] hover:text-[#faf7f2] transition-colors shadow-xs"
              >
                Chưa nhớ (0 điểm)
              </button>
              <button
                onClick={() => handleFlipSelfEvaluate(true)}
                className="py-3 px-4 rounded-lg border border-[var(--sage)]/40 bg-[var(--sage-light)] text-[var(--sage)] text-xs font-semibold hover:bg-[var(--sage)] hover:text-[#faf7f2] transition-colors shadow-xs"
              >
                Tôi đã biết từ này (+1 điểm)
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: TRẮC NGHIỆM 4 ĐÁP ÁN */}
      {mode === "multiple_choice" && currentQ && (
        <div className="space-y-6">
          <div className="p-8 rounded-xl bg-[var(--surface)] border border-[var(--border-medium)] shadow-sm text-center space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
              Chọn đáp án chính xác
            </span>
            <h3 className="text-3xl font-serif font-bold text-[var(--ink)]">
              {currentQ.questionText}
            </h3>
            {currentQ.subText && (
              <span className="inline-block px-3 py-1 rounded-full text-xs font-serif italic bg-[var(--surface-raised)] text-[var(--ink-secondary)]">
                {currentQ.subText}
              </span>
            )}
          </div>

          {/* 4 Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {currentQ.options?.map((option, idx) => {
              const letter = String.fromCharCode(65 + idx); // A, B, C, D
              let btnStyle = "border-[var(--border-medium)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-raised)]";

              if (isAnswerRevealed) {
                if (option === currentQ.correctAnswer) {
                  btnStyle = "border-[var(--sage)] bg-[var(--sage-light)] text-[var(--sage)] font-bold";
                } else if (option === selectedOption) {
                  btnStyle = "border-[var(--burgundy)] bg-[var(--wine-light)] text-[var(--burgundy)] font-medium";
                } else {
                  btnStyle = "opacity-40 border-[var(--border-light)] bg-[var(--surface)] text-[var(--ink-muted)]";
                }
              }

              return (
                <button
                  key={idx}
                  disabled={isAnswerRevealed}
                  onClick={() => handleOptionSelect(option)}
                  className={`p-4 rounded-lg border text-left text-xs transition-all shadow-xs flex items-center gap-3 ${btnStyle}`}
                >
                  <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center font-bold text-[11px] shrink-0">
                    {letter}
                  </span>
                  <span className="font-medium text-sm leading-relaxed">{option}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* MODE 3: GÕ LẠI TỪ TIẾNG ANH (TYPING) */}
      {mode === "typing" && currentQ && (
        <div className="space-y-6">
          <div className="p-8 rounded-xl bg-[var(--surface)] border border-[var(--border-medium)] shadow-sm text-center space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
              Gõ từ tiếng Anh tương ứng với nghĩa:
            </span>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--ink)] leading-snug">
              {currentQ.meaning}
            </h3>
            {currentQ.partOfSpeech && (
              <span className="inline-block px-3 py-1 rounded-full text-xs font-serif italic bg-[var(--surface-raised)] text-[var(--ink-secondary)]">
                Loại từ: {currentQ.partOfSpeech}
              </span>
            )}
          </div>

          {!typingFeedback ? (
            <form onSubmit={handleTypingSubmit} className="space-y-4">
              <input
                type="text"
                autoFocus
                value={typingInput}
                onChange={(e) => setTypingInput(e.target.value)}
                placeholder="Gõ từ tiếng Anh vào đây và nhấn Enter..."
                className="w-full p-3.5 text-base text-center bg-[var(--surface)] border-2 border-[var(--border-medium)] focus:border-[var(--navy)] rounded-lg text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={!typingInput.trim()}
                className="w-full py-3 rounded-lg bg-[var(--navy)] hover:bg-[var(--navy-hover)] text-[#faf7f2] text-xs font-semibold shadow-xs disabled:opacity-40 transition-colors"
              >
                Kiểm tra câu trả lời (Enter)
              </button>
            </form>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div
                className={`p-4 rounded-lg border text-center space-y-2 ${
                  typingFeedback.isCorrect
                    ? "bg-[var(--sage-light)] border-[var(--sage)]/40 text-[var(--sage)]"
                    : "bg-[var(--wine-light)] border-[var(--burgundy)]/40 text-[var(--burgundy)]"
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 font-bold text-sm">
                  {typingFeedback.isCorrect ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Chính xác!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      <span>Chưa chính xác!</span>
                    </>
                  )}
                </div>

                {!typingFeedback.isCorrect && (
                  <p className="text-xs">
                    Đáp án đúng là: <strong className="text-sm underline font-serif">{typingFeedback.correctAnswer}</strong>
                  </p>
                )}

                {typingFeedback.matchedSynonym && (
                  <p className="text-xs italic">
                    (Chấp nhận từ đồng nghĩa: {typingFeedback.matchedSynonym})
                  </p>
                )}
              </div>

              <button
                autoFocus
                onClick={handleTypingNext}
                className="w-full py-3 rounded-lg bg-[var(--navy)] hover:bg-[var(--navy-hover)] text-[#faf7f2] text-xs font-semibold shadow-xs flex items-center justify-center gap-2"
              >
                <span>Câu tiếp theo (Enter)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

