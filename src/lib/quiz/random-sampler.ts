/**
 * Tiện ích xáo trộn ngẫu nhiên Fisher-Yates, sinh đáp án nhiễu và so khớp câu trả lời
 */

import { normalizeWord } from "../import/normalizer";

/**
 * Thuật toán xáo trộn ngẫu nhiên Fisher–Yates chuẩn
 * Đảm bảo mọi hoán vị đều có xác suất xuất hiện đồng đều
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export interface QuizWordCandidate {
  id: string;
  topicId: string;
  word: string;
  wordNormalized: string;
  partOfSpeech: string | null;
  meaning: string;
  pronunciation: string | null;
  synonyms: string[];
}

/**
 * Sinh 3 đáp án nhiễu cho câu hỏi trắc nghiệm
 * - 1 đáp án đúng, 3 đáp án nhiễu
 * - Ưu tiên lấy từ cùng chủ đề và cùng loại từ (part_of_speech) để tạo độ thử thách hợp lý
 * - Thiếu thì lấy từ cùng chủ đề khác loại từ hoặc chủ đề khác
 * - Đảm bảo KHÔNG TRÙNG NHAU giữa 4 đáp án
 * - Xáo trộn ngẫu nhiên vị trí đáp án đúng
 */
export function generateMultipleChoiceOptions({
  correctWord,
  allCandidates,
  direction = "en_vi", // en_vi: câu hỏi là tiếng Anh, 4 đáp án là nghĩa tiếng Việt; vi_en: ngược lại
}: {
  correctWord: QuizWordCandidate;
  allCandidates: QuizWordCandidate[];
  direction?: "en_vi" | "vi_en";
}): {
  questionText: string;
  subText?: string;
  correctAnswer: string;
  options: string[];
} {
  const isEnToVi = direction === "en_vi";
  const questionText = isEnToVi ? correctWord.word : correctWord.meaning;
  const subText = isEnToVi
    ? correctWord.partOfSpeech || undefined
    : correctWord.partOfSpeech || undefined;
  const correctAnswer = isEnToVi ? correctWord.meaning : correctWord.word;

  // Lọc các từ khác (không trùng ID và không trùng đáp án)
  const otherCandidates = allCandidates.filter(
    (c) =>
      c.id !== correctWord.id &&
      (isEnToVi ? c.meaning !== correctWord.meaning : c.wordNormalized !== correctWord.wordNormalized)
  );

  // Nhóm 1: Cùng chủ đề và cùng loại từ
  const sameTopicSamePos = otherCandidates.filter(
    (c) =>
      c.topicId === correctWord.topicId &&
      c.partOfSpeech &&
      correctWord.partOfSpeech &&
      c.partOfSpeech.toLowerCase() === correctWord.partOfSpeech.toLowerCase()
  );

  // Nhóm 2: Cùng chủ đề
  const sameTopic = otherCandidates.filter((c) => c.topicId === correctWord.topicId);

  // Xáo trộn và chọn 3 đáp án nhiễu
  const shuffledSamePos = shuffleArray(sameTopicSamePos);
  const shuffledSameTopic = shuffleArray(sameTopic);
  const shuffledAll = shuffleArray(otherCandidates);

  const distractorSet = new Set<string>();

  // Thêm từ nhóm ưu tiên 1
  for (const item of shuffledSamePos) {
    const text = isEnToVi ? item.meaning : item.word;
    if (text !== correctAnswer && !distractorSet.has(text)) {
      distractorSet.add(text);
      if (distractorSet.size >= 3) break;
    }
  }

  // Nếu chưa đủ 3, lấy từ nhóm 2
  if (distractorSet.size < 3) {
    for (const item of shuffledSameTopic) {
      const text = isEnToVi ? item.meaning : item.word;
      if (text !== correctAnswer && !distractorSet.has(text)) {
        distractorSet.add(text);
        if (distractorSet.size >= 3) break;
      }
    }
  }

  // Nếu vẫn chưa đủ, lấy từ toàn bộ ứng viên
  if (distractorSet.size < 3) {
    for (const item of shuffledAll) {
      const text = isEnToVi ? item.meaning : item.word;
      if (text !== correctAnswer && !distractorSet.has(text)) {
        distractorSet.add(text);
        if (distractorSet.size >= 3) break;
      }
    }
  }

  // Kết hợp đáp án đúng và 3 đáp án nhiễu, sau đó xáo trộn ngẫu nhiên
  const finalOptions = shuffleArray([correctAnswer, ...Array.from(distractorSet)]);

  return {
    questionText,
    subText,
    correctAnswer,
    options: finalOptions,
  };
}

/**
 * Kiểm tra kết quả gõ từ tiếng Anh (Typing Mode)
 * - So khớp không phân biệt hoa thường, loại bỏ khoảng trắng thừa
 * - Chấp nhận từ chính
 * - Chấp nhận từ đồng nghĩa nếu người học gõ một từ đồng nghĩa hợp lệ
 */
export function checkTypingAnswer({
  userInput,
  correctWord,
}: {
  userInput: string;
  correctWord: QuizWordCandidate;
}): {
  isCorrect: boolean;
  userAnswerNormalized: string;
  matchedSynonym?: string;
} {
  const userNormalized = normalizeWord(userInput);
  const correctNormalized = correctWord.wordNormalized;

  if (userNormalized === correctNormalized) {
    return {
      isCorrect: true,
      userAnswerNormalized: userNormalized,
    };
  }

  // Kiểm tra danh sách từ đồng nghĩa
  if (correctWord.synonyms && correctWord.synonyms.length > 0) {
    for (const syn of correctWord.synonyms) {
      if (normalizeWord(syn) === userNormalized) {
        return {
          isCorrect: true,
          userAnswerNormalized: userNormalized,
          matchedSynonym: syn,
        };
      }
    }
  }

  return {
    isCorrect: false,
    userAnswerNormalized: userNormalized,
  };
}

