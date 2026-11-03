import { describe, it, expect } from "vitest";
import {
  shuffleArray,
  generateMultipleChoiceOptions,
  checkTypingAnswer,
  QuizWordCandidate,
} from "../random-sampler";

describe("Thuật toán Xáo trộn Fisher–Yates", () => {
  it("Giữ nguyên số lượng phần tử và không làm mất dữ liệu", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const output = shuffleArray(input);

    expect(output.length).toBe(input.length);
    expect(new Set(output)).toEqual(new Set(input));
  });

  it("Không làm biến đổi mảng gốc ban đầu (immutable)", () => {
    const original = ["a", "b", "c"];
    const originalCopy = [...original];
    shuffleArray(original);
    expect(original).toEqual(originalCopy);
  });
});

describe("Sinh đáp án trắc nghiệm 4 lựa chọn (Distractor Generator)", () => {
  const candidatePool: QuizWordCandidate[] = [
    {
      id: "1",
      topicId: "t1",
      word: "meticulous",
      wordNormalized: "meticulous",
      partOfSpeech: "adjective",
      meaning: "tỉ mỉ, kỹ lưỡng",
      pronunciation: "/məˈtɪk.jə.ləs/",
      synonyms: ["diligent", "thorough"],
    },
    {
      id: "2",
      topicId: "t1",
      word: "ubiquitous",
      wordNormalized: "ubiquitous",
      partOfSpeech: "adjective",
      meaning: "có mặt ở khắp nơi",
      pronunciation: "/juːˈbɪk.wə.təs/",
      synonyms: ["omnipresent"],
    },
    {
      id: "3",
      topicId: "t1",
      word: "eloquent",
      wordNormalized: "eloquent",
      partOfSpeech: "adjective",
      meaning: "hùng biện, lưu loát",
      pronunciation: "/ˈel.ə.kwənt/",
      synonyms: ["articulate"],
    },
    {
      id: "4",
      topicId: "t1",
      word: "scrutinize",
      wordNormalized: "scrutinize",
      partOfSpeech: "verb",
      meaning: "xem xét kỹ lưỡng",
      pronunciation: "/ˈskruː.tɪ.naɪz/",
      synonyms: ["examine"],
    },
    {
      id: "5",
      topicId: "t1",
      word: "paradigm",
      wordNormalized: "paradigm",
      partOfSpeech: "noun",
      meaning: "mô hình mẫu",
      pronunciation: "/ˈpær.ə.daɪm/",
      synonyms: ["model"],
    },
  ];

  it("Sinh ra đúng 4 đáp án không trùng lặp (1 đúng + 3 nhiễu)", () => {
    const mc = generateMultipleChoiceOptions({
      correctWord: candidatePool[0], // meticulous
      allCandidates: candidatePool,
      direction: "en_vi",
    });

    expect(mc.options.length).toBe(4);
    expect(new Set(mc.options).size).toBe(4); // Không có đáp án trùng lặp
    expect(mc.options).toContain(candidatePool[0].meaning); // Chứa đáp án đúng
    expect(mc.correctAnswer).toBe(candidatePool[0].meaning);
  });

  it("Ưu tiên chọn từ cùng loại từ (adjective) làm đáp án nhiễu", () => {
    const mc = generateMultipleChoiceOptions({
      correctWord: candidatePool[0], // meticulous (adj)
      allCandidates: candidatePool,
      direction: "en_vi",
    });

    // candidatePool[1] và candidatePool[2] cũng là adjective, nên phải được ưu tiên có mặt
    expect(mc.options).toContain("có mặt ở khắp nơi");
    expect(mc.options).toContain("hùng biện, lưu loát");
  });

  it("Hỗ trợ trắc nghiệm đảo chiều Việt -> Anh", () => {
    const mc = generateMultipleChoiceOptions({
      correctWord: candidatePool[0],
      allCandidates: candidatePool,
      direction: "vi_en",
    });

    expect(mc.questionText).toBe("tỉ mỉ, kỹ lưỡng");
    expect(mc.correctAnswer).toBe("meticulous");
    expect(mc.options).toContain("meticulous");
    expect(mc.options.length).toBe(4);
  });
});

describe("Đánh giá kết quả gõ từ tiếng Anh (Typing Evaluator)", () => {
  const word: QuizWordCandidate = {
    id: "1",
    topicId: "t1",
    word: "meticulous",
    wordNormalized: "meticulous",
    partOfSpeech: "adjective",
    meaning: "tỉ mỉ",
    pronunciation: "/məˈtɪk.jə.ləs/",
    synonyms: ["diligent", "thorough", "precise"],
  };

  it("Chấp nhận từ chính xác (không phân biệt hoa thường và khoảng trắng)", () => {
    expect(checkTypingAnswer({ userInput: "meticulous", correctWord: word }).isCorrect).toBe(true);
    expect(checkTypingAnswer({ userInput: "  MeTiCuLoUs  ", correctWord: word }).isCorrect).toBe(true);
  });

  it("Chấp nhận từ đồng nghĩa hợp lệ nếu người học gõ đúng", () => {
    const res1 = checkTypingAnswer({ userInput: "diligent", correctWord: word });
    expect(res1.isCorrect).toBe(true);
    expect(res1.matchedSynonym).toBe("diligent");

    const res2 = checkTypingAnswer({ userInput: "THOROUGH", correctWord: word });
    expect(res2.isCorrect).toBe(true);
    expect(res2.matchedSynonym).toBe("thorough");
  });

  it("Từ chối từ sai chính tả", () => {
    const res = checkTypingAnswer({ userInput: "meticulus", correctWord: word });
    expect(res.isCorrect).toBe(false);
  });
});

