/**
 * Tiện ích phát âm từ vựng tiếng Anh sử dụng Web Speech API của trình duyệt
 * Ưu tiên giọng chuẩn en-US hoặc en-GB
 */

let voicesLoaded = false;
let englishVoice: SpeechSynthesisVoice | null = null;

function loadVoices(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    voicesLoaded = true;
    // Ưu tiên en-US, sau đó đến en-GB hoặc bất kỳ giọng tiếng Anh nào
    englishVoice =
      voices.find((v) => v.lang === "en-US" && !v.name.includes("Synthetic")) ||
      voices.find((v) => v.lang === "en-US") ||
      voices.find((v) => v.lang === "en-GB") ||
      voices.find((v) => v.lang.startsWith("en")) ||
      null;
  }
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speakEnglishWord(word: string, rate = 0.9): boolean {
  if (!isSpeechSupported()) {
    console.warn("Trình duyệt không hỗ trợ Web Speech API.");
    return false;
  }

  try {
    window.speechSynthesis.cancel(); // Dừng phát âm trước đó nếu có

    const cleanWord = word.trim();
    if (!cleanWord) return false;

    const utterance = new SpeechSynthesisUtterance(cleanWord);
    utterance.lang = "en-US";
    utterance.rate = rate;

    if (!voicesLoaded) {
      loadVoices();
    }

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.error("Lỗi khi phát âm:", err);
    return false;
  }
}

