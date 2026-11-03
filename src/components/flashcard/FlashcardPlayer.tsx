"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { speakEnglishWord, isSpeechSupported } from "@/lib/speech/speaker";
import { toggleWordKnownAction, resetTopicProgressAction, StudyWordItem } from "@/actions/study";
import { OwlMascot } from "@/components/owl/OwlMascot";
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
  GraduationCap,
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
      <div className="p-8 sm:p-12 max-w-xl mx-auto rounded-2xl bg-[var(--surface)] border border-[var(--border-light)] text-center space-y-5 shadow-xs">
        <OwlMascot variant="thinking" size={90} className="mx-auto" />
        <div className="space-y-1.5">
          <h3 className="font-serif font-bold text-xl text-[var(--ink)]">
            {filterUnknownOnly ? "Tuyệt vời! Bạn đã thuộc tất cả từ trong chủ đề này." : "Chưa có từ vựng nào trong chủ đề."}
          </h3>
          <p className="text-xs sm:text-sm text-[var(--ink-secondary)] max-w-md mx-auto leading-relaxed">
            {filterUnknownOnly
              ? "Cú Tri Thức ghi nhận bạn đã nắm vững toàn bộ từ vựng ở đây. Hãy ôn lại hoặc làm bài kiểm tra để củng cố nhé!"
              : "Chủ đề này hiện chưa có dữ liệu từ vựng. Cú đang chuẩn bị thêm tài liệu!"}
          </p>
        </div>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          {filterUnknownOnly && (
            <button
              onClick={() => {
                setFilterUnknownOnly(false);
                handleResetStudy();
              }}
              className="px-5 py-2.5 text-xs font-semibold rounded-lg bg-[var(--navy)] text-[#faf7f2] hover:bg-[var(--navy-hover)] transition-colors shadow-xs"
            >
              Xem lại tất cả từ vựng
            </button>
          )}
          <Link
            href="/chu-de"
            className="px-5 py-2.5 text-xs font-medium border border-[var(--border-medium)] rounded-lg bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-raised)] transition-colors"
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
      <div className="max-w-xl mx-auto p-8 sm:p-10 rounded-2xl bg-[var(--surface)] border border-[var(--border-light)] text-center space-y-6 shadow-md animate-in fade-in duration-300">
        <div className="relative inline-block mx-auto">
          <OwlMascot variant="celebrating" size={110} className="mx-auto" />
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[var(--amber)] text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-xs uppercase tracking-wider">
            Xuất sắc!
          </span>
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--ink)]">
            Hoàn thành lượt học!
          </h2>
          <p className="text-xs sm:text-sm text-[var(--ink-secondary)]">
            Cú Tri Thức chúc mừng bạn đã hoàn thành {activeWords.length} thẻ từ của chủ đề <strong>{topic.name}</strong>.
          </p>
        </div>

        {/* Progress box */}
        <div className="p-5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-medium)] text-center space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--ink)]">
            <span>Tiến độ tích lũy</span>
            <span className="text-[var(--navy)] font-bold">{knownCount} / {wordList.length} từ ({progressPercent}%)</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-[var(--border-medium)] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--amber)] to-[var(--sage)] transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-[var(--ink-muted)]">
            {progressPercent >= 80
              ? "Trí nhớ của bạn rất sắc bén! Sẵn sàng thử sức với bài kiểm tra chưa?"
              : "Hãy kiên trì lặp lại ngắt quãng để khắc sâu vào trí nhớ dài hạn."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={handleResetStudy}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[var(--navy)] text-[#faf7f2] hover:bg-[var(--navy-hover)] text-xs font-semibold transition-all shadow-xs hover:-translate-y-0.5 active:translate-y-0"
          >
            <RotateCw className="w-4 h-4" />
            <span>Học lại chủ đề này</span>
          </button>

          <Link
            href={`/kiem-tra?topic=${topic.id}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-[var(--border-medium)] bg-[var(--surface)] hover:bg-[var(--surface-raised)] text-[var(--ink)] text-xs font-semibold transition-colors"
          >
            <Brain className="w-4 h-4 text-[var(--amber)]" />
            <span>Làm bài kiểm tra ngay</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Diligent Owl Companion Status */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border-light)] shadow-xs">
        <div className="flex items-center gap-2.5">
          <OwlMascot variant="badge" size={32} />
          <div>
            <span className="block text-xs font-semibold text-[var(--ink)]">
              {progressPercent === 100
                ? "Cú khen ngợi: Tuyệt đỉnh! Bạn đã thuộc toàn bộ từ vựng!"
                : progressPercent >= 50
                ? "Cú tiếp sức: Đã vượt qua 50% chặng đường, kiên trì nhé!"
                : "Cú đồng hành: Ghi nhớ từng từ thật vững chắc nhé bạn học!"}
            </span>
            <span className="text-[10px] text-[var(--ink-muted)]">
              Chủ đề: {topic.name}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-[var(--amber-light)] text-[var(--amber)]">
          <span>{knownCount}/{wordList.length}</span>
          <span className="hidden sm:inline text-[11px] font-medium">thuộc</span>
        </div>
      </div>

      {/* Top Controls Bar: Mode Switcher, Filter, Auto Pronounce */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Study Mode: Standard vs Reverse */}
        <div className="inline-flex p-1 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-medium)]">
          <button
            onClick={() => {
              setMode("standard");
              setIsFlipped(false);
            }}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
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
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              mode === "reverse"
                ? "bg-[var(--surface)] text-[var(--navy)] shadow-xs"
                : "text-[var(--ink-secondary)] hover:text-[var(--ink)]"
            }`}
          >
            Đảo chiều (Việt → Anh)
          </button>
        </div>

        {/* Filter & Pronounce Switches */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setFilterUnknownOnly(!filterUnknownOnly);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            aria-pressed={filterUnknownOnly}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-colors ${
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
            aria-pressed={autoPronounce}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-colors ${
              autoPronounce
                ? "border-[var(--navy)] bg-[var(--surface-raised)] text-[var(--navy)] font-semibold"
                : "border-[var(--border-medium)] bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
            title={autoPronounce ? "Đang bật tự phát âm" : "Đang tắt tự phát âm"}
          >
            {autoPronounce ? <Volume2 className="w-3.5 h-3.5 text-[var(--navy)]" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Tự phát âm</span>
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
            Tiến độ: <strong className="text-[var(--sage)]">{progressPercent}%</strong>
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Tiến độ học chủ đề"
          className="w-full h-2 rounded-full bg-[var(--border-medium)] overflow-hidden"
        >
          <div
            className="h-full bg-gradient-to-r from-[var(--navy)] to-[var(--amber)] transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / activeWords.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 3D FLASHCARD with Hardware Acceleration & Accessible Keyboard Control */}
      <div
        role="button"
        tabIndex={0}
        aria-label={isFlipped ? "Lật lại mặt trước của thẻ từ vựng" : "Lật sang mặt sau để xem nghĩa của từ vựng"}
        aria-expanded={isFlipped}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleFlip();
          }
        }}
        className="perspective-1000 select-none cursor-pointer card-touch-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--navy)] rounded-2xl"
        onClick={handleFlip}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={`relative min-h-[310px] sm:min-h-[350px] w-full rounded-2xl border border-[var(--border-medium)] bg-[var(--surface)] shadow-md transition-transform duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)] transform-style-3d p-8 flex flex-col justify-between hover:shadow-lg ${
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
                  className="p-2 rounded-full hover:bg-[var(--surface-raised)] text-[var(--navy)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--navy)]"
                  title="Nghe phát âm (R)"
                  aria-label="Nghe phát âm tiếng Anh (Phím R)"
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
                className="p-2 rounded-full hover:bg-[var(--surface-raised)] text-[var(--navy)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--navy)]"
                title="Nghe phát âm (R)"
                aria-label="Nghe phát âm tiếng Anh (Phím R)"
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

