/**
 * Bộ quy đổi điểm số làm bài sang thang điểm IELTS Band Score (0 - 9.0)
 * và phân tích đánh giá kết quả từ Cú Tri Thức
 */

export interface BandEvaluation {
  band: number;
  cefrLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  title: string;
  evaluation: string;
  advice: string;
}

/**
 * Bảng quy đổi chuẩn 40 câu hỏi sang Band Score (theo thang Academic Reading / Listening)
 */
export function calculateIeltsBandScore(correctCount: number, totalCount: number): number {
  if (totalCount <= 0 || correctCount <= 0) return 1.0;

  // Chuẩn hóa về thang 40 câu nếu bài test có số câu khác 40
  const normalizedCorrect = Math.min(40, Math.round((correctCount / totalCount) * 40));

  if (normalizedCorrect >= 39) return 9.0;
  if (normalizedCorrect >= 37) return 8.5;
  if (normalizedCorrect >= 35) return 8.0;
  if (normalizedCorrect >= 32) return 7.5;
  if (normalizedCorrect >= 30) return 7.0;
  if (normalizedCorrect >= 26) return 6.5;
  if (normalizedCorrect >= 23) return 6.0;
  if (normalizedCorrect >= 18) return 5.5;
  if (normalizedCorrect >= 16) return 5.0;
  if (normalizedCorrect >= 13) return 4.5;
  if (normalizedCorrect >= 10) return 4.0;
  if (normalizedCorrect >= 6) return 3.5;
  if (normalizedCorrect >= 4) return 3.0;
  if (normalizedCorrect >= 2) return 2.5;
  return 2.0;
}

/**
 * Trả về nhận xét và lời khuyên học tập dựa trên điểm Band Score đạt được
 */
export function getBandEvaluation(band: number): BandEvaluation {
  if (band >= 8.0) {
    return {
      band,
      cefrLevel: "C2",
      title: "Xuất chúng (Expert User)",
      evaluation: "Bạn có vốn từ vựng và nền tảng ngữ pháp vô cùng vững chắc, xử lý câu từ tinh tế và chính xác.",
      advice: "Tiếp tục duy trì đọc các ấn phẩm học thuật cao cấp và trau chuốt sắc thái câu văn (collocations hiếm gặp) để tối đa hóa điểm Lexical Resource.",
    };
  }

  if (band >= 7.0) {
    return {
      band,
      cefrLevel: "C1",
      title: "Thành thạo (Good User)",
      evaluation: "Khả năng làm chủ ngôn ngữ tốt, nắm chắc các cấu trúc phức tạp và từ vựng học thuật đa dạng.",
      advice: "Tập trung rèn luyện các cấu trúc nâng cao như đảo ngữ (Inversion), câu chẻ (Cleft sentences) và từ vựng mang tính học thuật cao (AWL).",
    };
  }

  if (band >= 6.0) {
    return {
      band,
      cefrLevel: "B2",
      title: "Khá vững (Competent User)",
      evaluation: "Đã nắm được ngữ pháp nòng cốt và lượng từ vựng căn bản để xử lý đề thi thông dụng.",
      advice: "Nên mở rộng vốn từ sang các chủ đề học thuật chuyên sâu và hạn chế các lỗi ngữ pháp nhỏ về thì và mạo từ.",
    };
  }

  if (band >= 5.0) {
    return {
      band,
      cefrLevel: "B1",
      title: "Đang phát triển (Modest User)",
      evaluation: "Có nền tảng cơ bản nhưng còn dễ mắc bẫy từ vựng đồng nghĩa và các cấu trúc câu phức tạp.",
      advice: "Hãy học kỹ các bài trong Lộ trình Ngữ pháp Chặng 1 & 2 và tích lũy ít nhất 15-20 từ vựng mỗi ngày với Flashcards.",
    };
  }

  return {
    band,
    cefrLevel: "A2",
    title: "Cần xây gốc vững (Limited User)",
    evaluation: "Vốn từ và cấu trúc ngữ pháp nền tảng còn hạn chế, cần tập trung củng cố lại từ đầu.",
    advice: "Đừng lo lắng! Hãy bắt đầu từ Chặng 1 của Lộ trình Từ vựng & Ngữ pháp, Cú Tri Thức sẽ đồng hành cùng bạn từng ngày.",
  };
}

