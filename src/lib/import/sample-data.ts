import ExcelJS from "exceljs";

export const SAMPLE_VOCABULARY = [
  {
    word: "meticulous",
    partOfSpeech: "adjective",
    meaning: "tỉ mỉ, kỹ lưỡng, hết sức cẩn thận",
    pronunciation: "/məˈtɪk.jə.ləs/",
    synonyms: "diligent; thorough; precise",
  },
  {
    word: "ubiquitous",
    partOfSpeech: "adjective",
    meaning: "phổ biến, có mặt ở khắp mọi nơi",
    pronunciation: "/juːˈbɪk.wə.təs/",
    synonyms: "omnipresent; everywhere; pervasive",
  },
  {
    word: "scrutinize",
    partOfSpeech: "verb",
    meaning: "xem xét kỹ lưỡng, nghiên cứu cẩn thận",
    pronunciation: "/ˈskruː.tɪ.naɪz/",
    synonyms: "examine; inspect; investigate",
  },
  {
    word: "paradigm",
    partOfSpeech: "noun",
    meaning: "mô hình, kiểu mẫu chuẩn mực",
    pronunciation: "/ˈpær.ə.daɪm/",
    synonyms: "model; pattern; archetype",
  },
  {
    word: "eloquent",
    partOfSpeech: "adjective",
    meaning: "hùng biện, có tài diễn thuyết lưu loát",
    pronunciation: "/ˈel.ə.kwənt/",
    synonyms: "articulate; expressive; fluent",
  },
];

/**
 * Tạo nội dung CSV mẫu có UTF-8 BOM để Excel hiển thị đúng dấu tiếng Việt
 */
export function generateSampleCsv(language: "vi" | "en" = "vi"): string {
  const BOM = "\uFEFF";
  let header = "";
  if (language === "vi") {
    header = "Từ vựng,Loại từ,Nghĩa tiếng Việt,Phát âm,Từ đồng nghĩa\n";
  } else {
    header = "word,part_of_speech,meaning,pronunciation,synonyms\n";
  }

  const rows = SAMPLE_VOCABULARY.map(
    (item) =>
      `"${item.word}","${item.partOfSpeech}","${item.meaning}","${item.pronunciation}","${item.synonyms}"`
  ).join("\n");

  return BOM + header + rows;
}

/**
 * Tạo file Excel (XLSX) mẫu bằng ExcelJS với định dạng thanh lịch
 */
export async function generateSampleExcel(language: "vi" | "en" = "vi"): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Từ vựng mẫu");

  if (language === "vi") {
    worksheet.columns = [
      { header: "Từ vựng (word)", key: "word", width: 20 },
      { header: "Loại từ (part_of_speech)", key: "partOfSpeech", width: 22 },
      { header: "Nghĩa tiếng Việt (meaning)", key: "meaning", width: 35 },
      { header: "Phát âm (pronunciation)", key: "pronunciation", width: 20 },
      { header: "Từ đồng nghĩa (synonyms)", key: "synonyms", width: 35 },
    ];
  } else {
    worksheet.columns = [
      { header: "word", key: "word", width: 20 },
      { header: "part_of_speech", key: "partOfSpeech", width: 20 },
      { header: "meaning", key: "meaning", width: 35 },
      { header: "pronunciation", key: "pronunciation", width: 20 },
      { header: "synonyms", key: "synonyms", width: 35 },
    ];
  }

  // Header style
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1B2A4A" }, // Navy
  };
  headerRow.alignment = { vertical: "middle", horizontal: "left" };

  SAMPLE_VOCABULARY.forEach((item) => {
    worksheet.addRow(item);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

