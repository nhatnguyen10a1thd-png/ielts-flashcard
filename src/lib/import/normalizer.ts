/**
 * Chuẩn hoá dữ liệu từ vựng và nhận diện tiêu đề cột tiếng Anh / tiếng Việt
 */

export interface ParsedWordRow {
  rowNumber: number;
  word: string;
  wordNormalized: string;
  partOfSpeech: string | null;
  meaning: string;
  pronunciation: string | null;
  synonyms: string[];
  isValid: boolean;
  error?: string;
}

export interface ColumnMapping {
  wordKey: string | null;
  partOfSpeechKey: string | null;
  meaningKey: string | null;
  pronunciationKey: string | null;
  synonymsKey: string | null;
}

/**
 * Chuẩn hoá chuỗi tiêu đề để so khớp (bỏ dấu cách thừa, chuyển chữ thường, bỏ dấu ngoặc đơn và gạch ngang)
 */
export function cleanHeaderString(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[()[\]{}_\-]+/g, " ")
    .replace(/\s+/g, " ");
}

/**
 * Tự động tìm ánh xạ các cột từ danh sách headers của file
 * Hỗ trợ nhận diện thông minh cả tiếng Anh lẫn tiếng Việt, các dạng viết kèm ngoặc đơn
 */
export function detectColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    wordKey: null,
    partOfSpeechKey: null,
    meaningKey: null,
    pronunciationKey: null,
    synonymsKey: null,
  };

  for (const rawHeader of headers) {
    if (!rawHeader) continue;
    const cleaned = cleanHeaderString(rawHeader);

    // 1. Cột từ vựng (Word)
    if (
      !mapping.wordKey &&
      (cleaned === "word" ||
        cleaned === "words" ||
        cleaned.includes("tu vung") ||
        cleaned.includes("từ vựng") ||
        cleaned === "tu" ||
        cleaned === "từ" ||
        cleaned.includes("tieng anh") ||
        cleaned.includes("tiếng anh") ||
        cleaned.includes("vocabulary") ||
        cleaned.startsWith("word"))
    ) {
      mapping.wordKey = rawHeader;
      continue;
    }

    // 2. Cột loại từ (Part of Speech)
    if (
      !mapping.partOfSpeechKey &&
      (cleaned.includes("part of speech") ||
        cleaned.includes("part_of_speech") ||
        cleaned === "pos" ||
        cleaned.includes("loai tu") ||
        cleaned.includes("loại từ") ||
        cleaned.includes("tu loai") ||
        cleaned.includes("từ loại") ||
        cleaned === "type")
    ) {
      mapping.partOfSpeechKey = rawHeader;
      continue;
    }

    // 3. Cột nghĩa tiếng Việt (Meaning)
    if (
      !mapping.meaningKey &&
      (cleaned.includes("meaning") ||
        cleaned.includes("nghia") ||
        cleaned.includes("nghĩa") ||
        cleaned.includes("dich") ||
        cleaned.includes("dịch") ||
        cleaned.includes("definition") ||
        cleaned.includes("tieng viet") ||
        cleaned.includes("tiếng việt") ||
        cleaned.includes("vietnamese"))
    ) {
      mapping.meaningKey = rawHeader;
      continue;
    }

    // 4. Cột phát âm / phiên âm (Pronunciation / IPA)
    if (
      !mapping.pronunciationKey &&
      (cleaned.includes("pronunciation") ||
        cleaned.includes("phat am") ||
        cleaned.includes("phát âm") ||
        cleaned.includes("ipa") ||
        cleaned.includes("phien am") ||
        cleaned.includes("phiên âm") ||
        cleaned.includes("phonetic"))
    ) {
      mapping.pronunciationKey = rawHeader;
      continue;
    }

    // 5. Cột từ đồng nghĩa (Synonyms)
    if (
      !mapping.synonymsKey &&
      (cleaned.includes("synonym") ||
        cleaned.includes("dong nghia") ||
        cleaned.includes("đồng nghĩa") ||
        cleaned.includes("similar"))
    ) {
      mapping.synonymsKey = rawHeader;
      continue;
    }
  }

  return mapping;
}

/**
 * Chuẩn hoá từ tiếng Anh: chữ thường, bỏ khoảng trắng thừa đầu cuối và giữa từ
 */
export function normalizeWord(word: string): string {
  return word
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * Chuẩn hoá loại từ (noun, verb, adj, adv...)
 */
export function normalizePartOfSpeech(pos: string | null | undefined): string | null {
  if (!pos) return null;
  const trimmed = pos.trim().toLowerCase();
  if (!trimmed) return null;

  const posMap: Record<string, string> = {
    n: "noun",
    v: "verb",
    adj: "adjective",
    adv: "adverb",
    prep: "preposition",
    conj: "conjunction",
    pron: "pronoun",
    interj: "interjection",
    "danh từ": "noun",
    "động từ": "verb",
    "tính từ": "adjective",
    "trạng từ": "adverb",
    "giới từ": "preposition",
    "liên từ": "conjunction",
    "đại từ": "pronoun",
  };

  return posMap[trimmed] || trimmed;
}

/**
 * Phân tích danh sách từ đồng nghĩa: phân tách bằng dấu chấm phẩy ';' hoặc dấu phẩy ','
 */
export function parseSynonyms(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((item) => String(item).trim())
      .filter((item) => item.length > 0);
  }

  const str = String(raw).trim();
  if (!str) return [];

  return str
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}
