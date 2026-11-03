import { describe, it, expect } from "vitest";
import {
  normalizeWord,
  normalizePartOfSpeech,
  parseSynonyms,
  detectColumnMapping,
  cleanHeaderString,
} from "../normalizer";
import {
  parseCsvContent,
  stripBom,
  detectCsvDelimiter,
  parseExcelBuffer,
} from "../file-parser";
import { generateSampleCsv, generateSampleExcel } from "../sample-data";

describe("Chuẩn hoá dữ liệu (Normalizer)", () => {
  it("Chuẩn hoá từ tiếng Anh: chữ thường và bỏ khoảng trắng thừa", () => {
    expect(normalizeWord("  ScRuTiNiZe  ")).toBe("scrutinize");
    expect(normalizeWord("apple   pie")).toBe("apple pie");
  });

  it("Chuẩn hoá loại từ viết tắt tiếng Anh và tiếng Việt", () => {
    expect(normalizePartOfSpeech("n")).toBe("noun");
    expect(normalizePartOfSpeech("danh từ")).toBe("noun");
    expect(normalizePartOfSpeech("V")).toBe("verb");
    expect(normalizePartOfSpeech("động từ")).toBe("verb");
    expect(normalizePartOfSpeech("adj")).toBe("adjective");
    expect(normalizePartOfSpeech("tính từ")).toBe("adjective");
    expect(normalizePartOfSpeech("adv")).toBe("adverb");
    expect(normalizePartOfSpeech("trạng từ")).toBe("adverb");
    expect(normalizePartOfSpeech(null)).toBeNull();
  });

  it("Phân tích danh sách từ đồng nghĩa phân tách bằng dấu ; hoặc ,", () => {
    expect(parseSynonyms("diligent; thorough; precise")).toEqual([
      "diligent",
      "thorough",
      "precise",
    ]);
    expect(parseSynonyms("fast, quick, rapid")).toEqual(["fast", "quick", "rapid"]);
    expect(parseSynonyms("")).toEqual([]);
    expect(parseSynonyms(null)).toEqual([]);
  });

  it("Nhận diện chính xác tiêu đề cột bằng cả tiếng Anh và tiếng Việt", () => {
    const vietnameseHeaders = [
      "Từ vựng",
      "Loại từ",
      "Nghĩa tiếng Việt",
      "Phát âm",
      "Từ đồng nghĩa",
    ];
    const mappingVi = detectColumnMapping(vietnameseHeaders);
    expect(mappingVi.wordKey).toBe("Từ vựng");
    expect(mappingVi.partOfSpeechKey).toBe("Loại từ");
    expect(mappingVi.meaningKey).toBe("Nghĩa tiếng Việt");
    expect(mappingVi.pronunciationKey).toBe("Phát âm");
    expect(mappingVi.synonymsKey).toBe("Từ đồng nghĩa");

    const englishHeaders = [
      "word",
      "part_of_speech",
      "meaning",
      "pronunciation",
      "synonyms",
    ];
    const mappingEn = detectColumnMapping(englishHeaders);
    expect(mappingEn.wordKey).toBe("word");
    expect(mappingEn.partOfSpeechKey).toBe("part_of_speech");
    expect(mappingEn.meaningKey).toBe("meaning");
    expect(mappingEn.pronunciationKey).toBe("pronunciation");
    expect(mappingEn.synonymsKey).toBe("synonyms");
  });
});

describe("Phân tích tập tin CSV (CSV Parser)", () => {
  it("Tự động loại bỏ UTF-8 BOM", () => {
    const textWithBom = "\uFEFFword,meaning\napple,quả táo";
    const stripped = stripBom(textWithBom);
    expect(stripped.startsWith("word")).toBe(true);
  });

  it("Tự động nhận diện dấu phân cách phẩy (,) hoặc chấm phẩy (;)", () => {
    const csvComma = "word,meaning,part_of_speech\napple,quả táo,noun";
    expect(detectCsvDelimiter(csvComma)).toBe(",");

    const csvSemicolon = "word;meaning;part_of_speech\napple;quả táo;noun";
    expect(detectCsvDelimiter(csvSemicolon)).toBe(";");
  });

  it("Phân tích chính xác nội dung CSV mẫu", () => {
    const sample = generateSampleCsv("vi");
    const result = parseCsvContent(sample);

    expect(result.totalRows).toBe(5);
    expect(result.validRows.length).toBe(5);
    expect(result.errorRows.length).toBe(0);

    const first = result.validRows[0];
    expect(first.word).toBe("meticulous");
    expect(first.partOfSpeech).toBe("adjective");
    expect(first.meaning).toBe("tỉ mỉ, kỹ lưỡng, hết sức cẩn thận");
    expect(first.synonyms).toContain("diligent");
  });

  it("Ghi nhận chính xác các dòng lỗi và không làm sập hệ thống", () => {
    const brokenCsv = `word,meaning
apple,quả táo
,thiếu từ vựng tiếng anh
banana,
cat,con mèo`;

    const result = parseCsvContent(brokenCsv);
    expect(result.validRows.length).toBe(2); // apple, cat
    expect(result.errorRows.length).toBe(2); // dòng thiếu word, dòng thiếu meaning
    expect(result.errorRows[0].error).toContain("Thiếu từ vựng");
    expect(result.errorRows[1].error).toContain("Thiếu nghĩa");
  });
});

describe("Phân tích tập tin Excel (ExcelJS Parser)", () => {
  it("Tạo và đọc chính xác file Excel mẫu", async () => {
    const excelBuffer = await generateSampleExcel("vi");
    const result = await parseExcelBuffer(excelBuffer);

    expect(result.validRows.length).toBe(5);
    expect(result.errorRows.length).toBe(0);
    expect(result.validRows[0].word).toBe("meticulous");
  });
});

