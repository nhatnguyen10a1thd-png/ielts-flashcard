"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { speakEnglishWord, isSpeechSupported } from "@/lib/speech/speaker";
import { toggleWordKnownAction, resetTopicProgressAction, StudyWordItem } from "@/actions/study";
import {
  Volume2,
  RotateCw,
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  VolumeX,
  Sparkles,
  BookOpen,
  Filter,
  CheckCircle2,
  Brain,
  HelpCircle,
} from "lucide-react";

interface FlashcardPlayerProps {
  topic: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  };
  initialWords: StudyWordItem[];
  isLoggedIn: boolean;
}

export function FlashcardPlayer({
  topic,
  initialWords,
  isLoggedIn,
}: FlashcardPlayerProps) {
  // Chế độ học: standard = Anh -> Việt; reverse = Việt -> Anh
  const [mode, setMode] = useState<"standard" | "reverse">("standard");
  const [filterUnknownOnly, setFilterUnknownOnly] = useState(false);
  const [autoPronounce, setAutoPronounce] = useState(false);

  // Danh sách từ vựng hiện tại
  const [wordList, setWordList] = useState<StudyWordItem[]>(initialWords);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Touch gesture state for mobile swipe
  const touchStartX = useRef<number | null>(null);

  // Load cài đặt tự động phát âm từ localStorage
  useEffect(() => {
    const savedAuto = localStorage.getItem("flashcard_auto_pronounce");
    if (savedAuto !== null) {
      setAutoPronounce(savedAuto === "true");
    }
  }, []);

  const toggleAutoPronounce = () => {
    const next = !autoPronounce;
    setAutoPronounce(next);
    localStorage.setItem("flashcard_auto_pronounce", String(next));
  };

  // Danh sách từ được lọc theo tuỳ chọn
  const activeWords = filterUnknownOnly
    ? wordList.filter((w) => !w.isKnown)
    : wordList;

  const currentWord: StudyWordItem | undefined = activeWords[currentIndex];

  // Phát âm từ hiện tại
  const playCurrentWordPronunciation = useCallback(() => {
    if (currentWord) {
      speakEnglishWord(currentWord.word);
    }
  }, [currentWord]);

  // Tự động phát âm khi chuyển thẻ nếu bật tuỳ chọn và từ tiếng Anh đang hiển thị
  useEffect(() => {
    if (!currentWord || isCompleted) return;

    // Chiều xuôi: mặt trước là tiếng Anh -> tự phát âm khi chuyển thẻ
    if (autoPronounce && mode === "standard" && !isFlipped) {
      const timer = setTimeout(() => {
        speakEnglishWord(currentWord.word);
      }, 150);
      return () => clearTimeout(timer);
    }

    // Chiều đảo: mặt sau là tiếng Anh -> tự phát âm khi lật sang mặt sau
    if (autoPronounce && mode === "reverse" && isFlipped) {
      const timer = setTimeout(() => {
        speakEnglishWord(currentWord.word);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, isFlipped, mode, autoPronounce, currentWord, isCompleted]);

  // Điều hướng thẻ
  const handleNext = useCallback(() => {
    if (currentIndex < activeWords.length - 1) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  }, [currentIndex, activeWords.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  // Đánh dấu đã thuộc / chưa thuộc
  const handleToggleKnown = useCallback(
    async (isKnown: boolean) => {
      if (!currentWord) return;

      // Cập nhật trạng thái cục bộ ngay lập tức để UI mượt mà
      setWordList((prev) =>
        prev.map((w) =>
          w.id === currentWord.id ? { ...w, isKnown, reviewCount: w.reviewCount + 1 } : w
        )
      );

      if (isLoggedIn) {
        await toggleWordKnownAction(currentWord.id, isKnown);
      }

      // Tự động chuyển thẻ tiếp theo sau khi đánh giá
      handleNext();
    },
    [currentWord, isLoggedIn, handleNext]
  );

  // Xử lý phím tắt trên máy tính (Space: lật thẻ, Mũi tên: chuyển thẻ, 1/2: Chưa thuộc/Đã thuộc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCompleted) return;

      // Tránh bắt phím khi đang gõ trong input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        handleFlip();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "1") {
        e.preventDefault();
        handleToggleKnown(false);
      } else if (e.key === "2") {
        e.preventDefault();
        handleToggleKnown(true);
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        playCurrentWordPronunciation();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleFlip, handleNext, handlePrev, handleToggleKnown, playCurrentWordPronunciation, isCompleted]);

  // Touch Swipe gestures cho thiết bị di động
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchEndX - touchStartX.current;

    // Ngưỡng vuốt tối thiểu 50px
    if (diffX < -50) {
      // Vuốt sang trái -> Thẻ tiếp theo
      handleNext();
    } else if (diffX > 50) {
      // Vuốt sang phải -> Thẻ trước đó
      handlePrev();
    }
    touchStartX.current = null;
  };

  const handleResetStudy = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
  };

  // Tính số từ đã thuộc
  const knownCount = wordList.filter((w) => w.isKnown).length;
  const progressPercent = wordList.length > 0 ? Math.round((knownCount / wordList.length) * 100) : 0;

  if (activeWords.length === 0) {
    return (
      <div className="p-10 max-w-xl mx-auto rounded-lg bg-[var(--surface)] border border-[var(--border-light)] text-center space-y-4 shadow-xs">
        <div className="p-3 w-12 h-12 rounded-full bg-[var(--sage-light)] text-[var(--sage)] mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="font-serif font-bold text-lg text-[var(--ink)]">
          {filterUnknownOnly ? "Tuyệt vời! Bạn đã thuộc tất cả từ trong chủ đề này." : "Chưa có từ vựng nào trong chủ đề."}
        </h3>
        <p className="text-xs text-[var(--ink-secondary)]">
          {filterUnknownOnly
            ? "Bạn có thể tắt bộ lọc để ôn lại toàn bộ từ vựng, hoặc bắt đầu làm bài kiểm tra để củng cố kiến thức."
            : "Chủ đề này hiện chưa có dữ liệu từ vựng."}
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          {filterUnknownOnly && (
            <button
              onClick={() => {
                setFilterUnknownOnly(false);
                handleResetStudy();
              }}
              className="px-4 py-2 text-xs font-semibold rounded bg-[var(--navy)] text-[#faf7f2]"
            >
              Xem lại tất cả từ vựng
            </button>
          )}
          <Link
            href="/chu-de"
            className="px-4 py-2 text-xs font-medium border border-[var(--border-medium)] rounded bg-[var(--surface)] text-[var(--ink)]"
          >
            Quay lại danh sách chủ đề
          </Link>
        </div>
      </div>
    );
  }

  // MÀN HÌNH HOÀN THÀNH LƯỢT HỌC
  if (isCompleted) {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-lg bg-[var(--surface)] border border-[var(--border-light)] text-center space-y-6 shadow-xs animate-in fade-in duration-300">
        <div className="w-14 h-14 rounded-full bg-[var(--surface-raised)] text-[var(--navy)] flex items-center justify-center mx-auto shadow-xs">
          <Sparkles className="w-7 h-7 text-[var(--burgundy)]" />
        </div>

        <div>
          <h2 className="text-2xl font-serif font-bold text-[var(--ink)]">
            Hoàn thành lượt học!
          </h2>
          <p className="mt-1 text-xs text-[var(--ink-secondary)]">
            Bạn vừa xem qua toàn bộ {activeWords.length} thẻ từ vựng của chủ đề <strong>{topic.name}</strong>.
          </p>
        </div>

        {/* Progress box */}
        <div className="p-4 rounded-md bg-[var(--surface-raised)] border border-[var(--border-light)] text-center space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--ink)]">
            <span>Tiến độ ghi nhớ</span>
            <span className="text-[var(--navy)]">{knownCount} / {wordList.length} từ ({progressPercent}%)</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[var(--border-medium)] overflow-hidden">
            <div
              className="h-full bg-[var(--navy)] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={handleResetStudy}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-md bg-[var(--navy)] text-[#faf7f2] hover:bg-[var(--navy-hover)] text-xs font-semibold transition-colors shadow-xs"
          >
            <RotateCw className="w-4 h-4" />
            <span>Học lại chủ đề này</span>
          </button>

          <Link
            href={`/kiem-tra?topic=${topic.id}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-md border border-[var(--border-medium)] bg-[var(--surface)] hover:bg-[var(--surface-raised)] text-[var(--ink)] text-xs font-semibold transition-colors"
          >
            <Brain className="w-4 h-4 text-[var(--burgundy)]" />
            <span>Làm bài kiểm tra</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Controls Bar: Mode Switcher, Filter, Auto Pronounce */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Study Mode: Standard vs Reverse */}
        <div className="inline-flex p-1 rounded-md bg-[var(--surface-raised)] border border-[var(--border-medium)]">
          <button
            onClick={() => {
              setMode("standard");
              setIsFlipped(false);
            }}
            className={`px-3 py-1.5 rounded-sm font-semibold transition-colors ${
              mode === "standard"
                ? "bg-[var(--surface)] text-[var(--navy)] shadow-xs"
                : "text-[var(--ink-secondary)] hover:text-[var(--ink)]"
            }`}
          >
            Chiều xuôi (Anh → Việt)
          </button>
          <button
            onClick={() => {
              setMode("reverse");
              setIsFlipped(false);
            }}
            className={`px-3 py-1.5 rounded-sm font-semibold transition-colors ${
              mode === "reverse"
                ? "bg-[var(--surface)] text-[var(--navy)] shadow-xs"
                : "text-[var(--ink-secondary)] hover:text-[var(--ink)]"
            }`}
          >
            Đảo chiều (Việt → Anh)
          </button>
        </div>

        {/* Filter & Pronounce Switches */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setFilterUnknownOnly(!filterUnknownOnly);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border transition-colors ${
              filterUnknownOnly
                ? "border-[var(--burgundy)] bg-[var(--wine-light)] text-[var(--burgundy)] font-semibold"
                : "border-[var(--border-medium)] bg-[var(--surface)] text-[var(--ink-secondary)] hover:text-[var(--ink)]"
            }`}
            title="Chỉ hiển thị các từ vựng chưa đánh dấu đã thuộc"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Chỉ từ chưa thuộc</span>
          </button>

          <button
            onClick={toggleAutoPronounce}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border transition-colors ${
              autoPronounce
                ? "border-[var(--navy)] bg-[var(--surface-raised)] text-[var(--navy)] font-semibold"
                : "border-[var(--border-medium)] bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
            title={autoPronounce ? "Đang bật tự phát âm" : "Đang tắt tự phát âm"}
          >
            {autoPronounce ? <Volume2 className="w-3.5 h-3.5 text-[var(--navy)]" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>Tự phát âm</span>
          </button>
        </div>
      </div>

      {/* Progress Counter & Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-[var(--ink-secondary)]">
          <span>
            Thẻ <strong>{currentIndex + 1}</strong> / {activeWords.length}
          </span>
          <span>
            Đã thuộc: <strong className="text-[var(--sage)]">{knownCount}</strong> / {wordList.length} ({progressPercent}%)
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-[var(--border-medium)] overflow-hidden">
          <div
            className="h-full bg-[var(--navy)] transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / activeWords.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 3D FLASHCARD */}
      <div
        className="perspective-1000 select-none cursor-pointer"
        onClick={handleFlip}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={`relative min-h-[300px] sm:min-h-[340px] w-full rounded-xl border border-[var(--border-medium)] bg-[var(--surface)] shadow-sm transition-transform duration-500 transform-style-3d p-8 flex flex-col justify-between ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          {/* FRONT FACE */}
          <div
            className={`absolute inset-0 p-8 flex flex-col justify-between backface-hidden ${
              isFlipped ? "pointer-events-none" : ""
            }`}
          >
            {/* Top row */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                {mode === "standard" ? "Mặt trước: Tiếng Anh" : "Mặt trước: Nghĩa tiếng Việt"}
              </span>

              {mode === "standard" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    playCurrentWordPronunciation();
                  }}
                  className="p-2 rounded-full hover:bg-[var(--surface-raised)] text-[var(--navy)] transition-colors"
                  title="Nghe phát âm (R)"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Center Content */}
            <div className="my-auto text-center space-y-3">
              {mode === "standard" ? (
                <>
                  <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[var(--ink)] tracking-tight">
                    {currentWord?.word}
                  </h2>
                  {currentWord?.partOfSpeech && (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-serif italic bg-[var(--surface-raised)] text-[var(--ink-secondary)]">
                      {currentWord.partOfSpeech}
                    </span>
                  )}
                  {currentWord?.pronunciation && (
                    <p className="text-sm font-mono text-[var(--ink-secondary)]">
                      {currentWord.pronunciation}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--ink)] leading-snug">
                    {currentWord?.meaning}
                  </h2>
                  {currentWord?.partOfSpeech && (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-serif italic bg-[var(--surface-raised)] text-[var(--ink-secondary)]">
                      {currentWord.partOfSpeech}
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Bottom prompt */}
            <div className="text-center text-[11px] text-[var(--ink-muted)] flex items-center justify-center gap-1">
              <span>Chạm hoặc nhấn Space để lật thẻ</span>
            </div>
          </div>

          {/* BACK FACE */}
          <div
            className={`absolute inset-0 p-8 flex flex-col justify-between backface-hidden rotate-y-180 bg-[var(--surface)] rounded-xl ${
              !isFlipped ? "pointer-events-none" : ""
            }`}
          >
            {/* Top row */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                {mode === "standard" ? "Mặt sau: Giải nghĩa" : "Mặt sau: Từ tiếng Anh"}
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playCurrentWordPronunciation();
                }}
                className="p-2 rounded-full hover:bg-[var(--surface-raised)] text-[var(--navy)] transition-colors"
                title="Nghe phát âm (R)"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            {/* Center Content */}
            <div className="my-auto text-center space-y-3">
              {mode === "standard" ? (
                <>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--ink)] leading-snug">
                    {currentWord?.meaning}
                  </h2>
                  {currentWord?.synonyms && currentWord.synonyms.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)] block mb-1">
                        Từ đồng nghĩa:
                      </span>
                      <p className="text-xs text-[var(--ink-secondary)] font-medium">
                        {currentWord.synonyms.join(", ")}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[var(--ink)] tracking-tight">
                    {currentWord?.word}
                  </h2>
                  {currentWord?.pronunciation && (
                    <p className="text-sm font-mono text-[var(--ink-secondary)]">
                      {currentWord.pronunciation}
                    </p>
                  )}
                  {currentWord?.synonyms && currentWord.synonyms.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)] block mb-1">
                        Từ đồng nghĩa:
                      </span>
                      <p className="text-xs text-[var(--ink-secondary)] font-medium">
                        {currentWord.synonyms.join(", ")}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Bottom prompt */}
            <div className="text-center text-[11px] text-[var(--ink-muted)] flex items-center justify-center gap-1">
              <span>Nhấn Space hoặc chạm để lật lại</span>
            </div>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS: CHƯA THUỘC (1) & ĐÃ THUỘC (2) */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => handleToggleKnown(false)}
          className={`py-3 px-4 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs ${
            !currentWord?.isKnown
              ? "border-[var(--burgundy)]/40 bg-[var(--wine-light)] text-[var(--burgundy)] hover:bg-[var(--burgundy)] hover:text-[#faf7f2]"
              : "border-[var(--border-medium)] bg-[var(--surface)] text-[var(--ink-secondary)] hover:bg-[var(--surface-raised)]"
          }`}
        >
          <X className="w-4 h-4" />
          <span>Chưa thuộc (Phím 1)</span>
        </button>

        <button
          type="button"
          onClick={() => handleToggleKnown(true)}
          className={`py-3 px-4 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs ${
            currentWord?.isKnown
              ? "border-[var(--sage)]/50 bg-[var(--sage-light)] text-[var(--sage)] font-bold shadow-xs hover:bg-[var(--sage)] hover:text-[#faf7f2]"
              : "border-[var(--border-medium)] bg-[var(--surface)] text-[var(--ink-secondary)] hover:bg-[var(--surface-raised)]"
          }`}
        >
          <Check className="w-4 h-4" />
          <span>Đã thuộc (Phím 2)</span>
        </button>
      </div>

      {/* NAVIGATION CONTROLS: PREV / NEXT */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={handlePrev}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-[var(--border-medium)] bg-[var(--surface)] text-xs font-medium text-[var(--ink)] hover:bg-[var(--surface-raised)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Từ trước (←)</span>
        </button>

        <button
          type="button"
          onClick={handleFlip}
          className="p-2 rounded-full border border-[var(--border-medium)] bg-[var(--surface)] text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:bg-[var(--surface-raised)]"
          title="Lật thẻ (Space)"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[var(--navy)] text-[#faf7f2] hover:bg-[var(--navy-hover)] text-xs font-semibold shadow-xs transition-colors"
        >
          <span>{currentIndex === activeWords.length - 1 ? "Xem kết quả" : "Từ tiếp theo (→)"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="p-3 rounded-md bg-[var(--surface-raised)] border border-[var(--border-light)] text-center text-[11px] text-[var(--ink-muted)] flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <span><strong>Space</strong>: Lật thẻ</span>
        <span><strong>← / →</strong>: Chuyển thẻ</span>
        <span><strong>1</strong>: Chưa thuộc</span>
        <span><strong>2</strong>: Đã thuộc</span>
        <span><strong>R</strong>: Phát âm</span>
        <span><strong>Vuốt</strong>: Trên điện thoại</span>
      </div>
    </div>
  );
}

