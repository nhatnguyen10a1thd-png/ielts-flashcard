import Papa from "papaparse";
import ExcelJS from "exceljs";
import {
  detectColumnMapping,
  normalizeWord,
  normalizePartOfSpeech,
  parseSynonyms,
  ParsedWordRow,
  ColumnMapping,
} from "./normalizer";

export interface ParseResult {
  headers: string[];
  mapping: ColumnMapping;
  totalRows: number;
  validRows: ParsedWordRow[];
  errorRows: Array<{ row: number; error: string; raw: Record<string, string> }>;
  previewRows: ParsedWordRow[];
}

/**
 * Loại bỏ UTF-8 BOM nếu có ở đầu chuỗi text
 */
export function stripBom(text: string): string {
  if (text.charCodeAt(0) === 0xfeff) {
    return text.slice(1);
  }
  return text;
}

/**
 * Tự động phát hiện dấu phân cách CSV (, hoặc ;)
 */
export function detectCsvDelimiter(sampleText: string): string {
  const firstLines = sampleText.split(/\r\n|\n|\r/).slice(0, 5).join("\n");
  const commaCount = (firstLines.match(/,/g) || []).length;
  const semicolonCount = (firstLines.match(/;/g) || []).length;
  return semicolonCount > commaCount ? ";" : ",";
}

/**
 * Phân tích nội dung file CSV thành danh sách từ vựng chuẩn hoá
 */
export function parseCsvContent(csvString: string, maxRows?: number): ParseResult {
  const cleaned = stripBom(csvString);
  const delimiter = detectCsvDelimiter(cleaned);

  const parsed = Papa.parse<Record<string, string>>(cleaned, {
    header: true,
    skipEmptyLines: "greedy",
    delimiter,
    preview: maxRows || 0,
    transformHeader: (h) => h.trim(),
  });

  const headers = parsed.meta.fields || [];
  const mapping = detectColumnMapping(headers);

  const validRows: ParsedWordRow[] = [];
  const errorRows: Array<{ row: number; error: string; raw: Record<string, string> }> = [];

  parsed.data.forEach((row, index) => {
    const rowNumber = index + 2; // +1 cho 1-index, +1 cho dòng header

    // Bỏ qua dòng trống hoàn toàn
    const hasValues = Object.values(row).some((val) => val && String(val).trim().length > 0);
    if (!hasValues) return;

    const rawWord = mapping.wordKey ? row[mapping.wordKey] : "";
    const rawMeaning = mapping.meaningKey ? row[mapping.meaningKey] : "";
    const rawPos = mapping.partOfSpeechKey ? row[mapping.partOfSpeechKey] : null;
    const rawPronunciation = mapping.pronunciationKey ? row[mapping.pronunciationKey] : null;
    const rawSynonyms = mapping.synonymsKey ? row[mapping.synonymsKey] : null;

    const trimmedWord = rawWord ? String(rawWord).trim() : "";
    const trimmedMeaning = rawMeaning ? String(rawMeaning).trim() : "";

    if (!trimmedWord) {
      errorRows.push({
        row: rowNumber,
        error: "Thiếu từ vựng (cột từ vựng để trống)",
        raw: row,
      });
      return;
    }

    if (!trimmedMeaning) {
      errorRows.push({
        row: rowNumber,
        error: "Thiếu nghĩa tiếng Việt",
        raw: row,
      });
      return;
    }

    validRows.push({
      rowNumber,
      word: trimmedWord,
      wordNormalized: normalizeWord(trimmedWord),
      partOfSpeech: normalizePartOfSpeech(rawPos),
      meaning: trimmedMeaning,
      pronunciation: rawPronunciation ? String(rawPronunciation).trim() : null,
      synonyms: parseSynonyms(rawSynonyms),
      isValid: true,
    });
  });

  return {
    headers,
    mapping,
    totalRows: validRows.length + errorRows.length,
    validRows,
    errorRows,
    previewRows: validRows.slice(0, 20),
  };
}

/**
 * Phân tích nội dung file Excel (XLSX) từ Buffer
 */
export async function parseExcelBuffer(
  buffer: Buffer | ArrayBuffer,
  maxRows?: number
): Promise<ParseResult> {
  const workbook = new ExcelJS.Workbook();
  // @ts-expect-error ExcelJS buffer overload
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("Tập tin Excel không có trang tính (worksheet) nào.");
  }

  const headers: string[] = [];
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber - 1] = String(cell.value || "").trim();
  });

  const mapping = detectColumnMapping(headers);

  const validRows: ParsedWordRow[] = [];
  const errorRows: Array<{ row: number; error: string; raw: Record<string, string> }> = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Bỏ qua header
    if (maxRows && validRows.length + errorRows.length >= maxRows) return;

    const rowObj: Record<string, string> = {};
    headers.forEach((header, index) => {
      const cell = row.getCell(index + 1);
      let val = "";
      if (cell.value !== null && cell.value !== undefined) {
        if (typeof cell.value === "object" && "text" in cell.value) {
          val = String(cell.value.text || "");
        } else {
          val = String(cell.value);
        }
      }
      rowObj[header] = val;
    });

    const hasValues = Object.values(rowObj).some((val) => val && val.trim().length > 0);
    if (!hasValues) return;

    const rawWord = mapping.wordKey ? rowObj[mapping.wordKey] : "";
    const rawMeaning = mapping.meaningKey ? rowObj[mapping.meaningKey] : "";
    const rawPos = mapping.partOfSpeechKey ? rowObj[mapping.partOfSpeechKey] : null;
    const rawPronunciation = mapping.pronunciationKey ? rowObj[mapping.pronunciationKey] : null;
    const rawSynonyms = mapping.synonymsKey ? rowObj[mapping.synonymsKey] : null;

    const trimmedWord = rawWord ? rawWord.trim() : "";
    const trimmedMeaning = rawMeaning ? rawMeaning.trim() : "";

    if (!trimmedWord) {
      errorRows.push({
        row: rowNumber,
        error: "Thiếu từ vựng (cột từ vựng để trống)",
        raw: rowObj,
      });
      return;
    }

    if (!trimmedMeaning) {
      errorRows.push({
        row: rowNumber,
        error: "Thiếu nghĩa tiếng Việt",
        raw: rowObj,
      });
      return;
    }

    validRows.push({
      rowNumber,
      word: trimmedWord,
      wordNormalized: normalizeWord(trimmedWord),
      partOfSpeech: normalizePartOfSpeech(rawPos),
      meaning: trimmedMeaning,
      pronunciation: rawPronunciation ? rawPronunciation.trim() : null,
      synonyms: parseSynonyms(rawSynonyms),
      isValid: true,
    });
  });

  return {
    headers,
    mapping,
    totalRows: validRows.length + errorRows.length,
    validRows,
    errorRows,
    previewRows: validRows.slice(0, 20),
  };
}

