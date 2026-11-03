import { adminDb } from "./admin";
import { Timestamp, FieldValue, QueryDocumentSnapshot, Query } from "firebase-admin/firestore";
import { shuffleArray, generateMultipleChoiceOptions, QuizWordCandidate } from "../quiz/random-sampler";

export interface FirestoreTopic {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isVisible: boolean;
  wordCount: number;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FirestoreWord {
  id: string;
  topicId: string;
  word: string;
  wordNormalized: string;
  partOfSpeech: string | null;
  meaning: string;
  pronunciation: string | null;
  synonyms: string[];
  createdAt: Date;
}

export interface FirestoreUserWordProgress {
  userId: string;
  wordId: string;
  topicId: string;
  isKnown: boolean;
  lastReviewedAt: Date;
  reviewCount: number;
  updatedAt: Date;
}

export interface FirestoreQuizAttempt {
  id: string;
  userId: string;
  mode: "flip_card" | "multiple_choice" | "typing";
  topicIds: string[];
  totalQuestions: number;
  correctAnswers: number;
  scorePercent: number;
  timeSpentSeconds: number;
  createdAt: Date;
}

/* =========================================================================
   1. QUẢN LÝ CHỦ ĐỀ (TOPICS)
   ========================================================================= */

export async function getFirestoreTopics(onlyVisible = true): Promise<FirestoreTopic[]> {
  let query: Query = adminDb.collection("topics");
  if (onlyVisible) {
    query = query.where("isVisible", "==", true).where("deletedAt", "==", null);
  }

  const snap = await query.get();
  return snap.docs.map((doc: QueryDocumentSnapshot) => {
    const d = doc.data();
    return {
      id: doc.id,
      name: d.name,
      slug: d.slug,
      description: d.description || "",
      isVisible: d.isVisible ?? true,
      wordCount: d.wordCount || 0,
      deletedAt: d.deletedAt ? d.deletedAt.toDate() : null,
      createdAt: d.createdAt ? d.createdAt.toDate() : new Date(),
      updatedAt: d.updatedAt ? d.updatedAt.toDate() : new Date(),
    };
  });
}

export async function getFirestoreTopicBySlug(slug: string): Promise<FirestoreTopic | null> {
  const snap = await adminDb.collection("topics").where("slug", "==", slug).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  const d = doc.data();
  return {
    id: doc.id,
    name: d.name,
    slug: d.slug,
    description: d.description || "",
    isVisible: d.isVisible ?? true,
    wordCount: d.wordCount || 0,
    deletedAt: d.deletedAt ? d.deletedAt.toDate() : null,
    createdAt: d.createdAt ? d.createdAt.toDate() : new Date(),
    updatedAt: d.updatedAt ? d.updatedAt.toDate() : new Date(),
  };
}

export async function createFirestoreTopic(data: {
  name: string;
  slug: string;
  description?: string;
  isVisible?: boolean;
}): Promise<string> {
  const ref = adminDb.collection("topics").doc(data.slug);
  await ref.set({
    name: data.name,
    slug: data.slug,
    description: data.description || "",
    isVisible: data.isVisible ?? true,
    wordCount: 0,
    deletedAt: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

/* =========================================================================
   2. QUẢN LÝ TỪ VỰNG & NHẬP THEO LÔ (WORDS & BATCH IMPORT DEDUPLICATION)
   ========================================================================= */

export function buildWordDocId(topicId: string, wordNorm: string, partOfSpeech: string | null): string {
  const posKey = (partOfSpeech || "none").toLowerCase().trim();
  // Document ID dạng chuỗi an toàn không chứa ký tự đặc biệt
  const safeTopic = topicId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const safeWord = wordNorm.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${safeTopic}__${safeWord}__${posKey}`;
}

export async function batchImportWordsToFirestore({
  topicId,
  wordsList,
}: {
  topicId: string;
  wordsList: Array<{
    word: string;
    wordNormalized: string;
    partOfSpeech: string | null;
    meaning: string;
    pronunciation: string | null;
    synonyms: string[];
  }>;
}): Promise<{ addedRows: number; skippedRows: number }> {
  let addedRows = 0;
  let skippedRows = 0;

  // Xử lý theo từng khối tối đa 400 documents (Firestore batch limit là 500)
  const CHUNK_SIZE = 400;
  for (let i = 0; i < wordsList.length; i += CHUNK_SIZE) {
    const chunk = wordsList.slice(i, i + CHUNK_SIZE);
    const batch = adminDb.batch();

    // 1. Kiểm tra tài liệu đã tồn tại trước khi ghi để đảm bảo Deduplication
    const docRefs = chunk.map((item) => {
      const docId = buildWordDocId(topicId, item.wordNormalized, item.partOfSpeech);
      return adminDb.collection("words").doc(docId);
    });

    const snapshots = await adminDb.getAll(...docRefs);

    for (let j = 0; j < chunk.length; j++) {
      const snap = snapshots[j];
      const item = chunk[j];
      const docRef = docRefs[j];

      if (snap.exists) {
        // Đã tồn tại trong chủ đề -> Bỏ qua
        skippedRows++;
      } else {
        batch.set(docRef, {
          topicId,
          word: item.word,
          wordNormalized: item.wordNormalized,
          partOfSpeech: item.partOfSpeech || null,
          meaning: item.meaning,
          pronunciation: item.pronunciation || null,
          synonyms: item.synonyms || [],
          createdAt: FieldValue.serverTimestamp(),
        });
        addedRows++;
      }
    }

    if (addedRows > 0) {
      await batch.commit();
    }
  }

  // Cập nhật tổng số từ vào document của Topic
  if (addedRows > 0) {
    await adminDb.collection("topics").doc(topicId).update({
      wordCount: FieldValue.increment(addedRows),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  return { addedRows, skippedRows };
}

export async function getWordsByFirestoreTopic(
  topicId: string,
  limitCount = 100
): Promise<FirestoreWord[]> {
  const snap = await adminDb
    .collection("words")
    .where("topicId", "==", topicId)
    .limit(limitCount)
    .get();

  return snap.docs.map((doc: QueryDocumentSnapshot) => {
    const d = doc.data();
    return {
      id: doc.id,
      topicId: d.topicId,
      word: d.word,
      wordNormalized: d.wordNormalized,
      partOfSpeech: d.partOfSpeech || null,
      meaning: d.meaning,
      pronunciation: d.pronunciation || null,
      synonyms: d.synonyms || [],
      createdAt: d.createdAt ? d.createdAt.toDate() : new Date(),
    };
  });
}

/* =========================================================================
   3. TIẾN ĐỘ HỌC FLASHCARD (USER WORD PROGRESS)
   ========================================================================= */

export async function toggleFirestoreWordKnown({
  userId,
  wordId,
  topicId,
  isKnown,
}: {
  userId: string;
  wordId: string;
  topicId: string;
  isKnown: boolean;
}) {
  const docId = `${userId}__${wordId}`;
  const ref = adminDb.collection("user_word_progress").doc(docId);
  const snap = await ref.get();

  if (snap.exists) {
    await ref.update({
      isKnown,
      lastReviewedAt: FieldValue.serverTimestamp(),
      reviewCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    await ref.set({
      userId,
      wordId,
      topicId,
      isKnown,
      lastReviewedAt: FieldValue.serverTimestamp(),
      reviewCount: 1,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  return { success: true };
}

/* =========================================================================
   4. KIỂM TRA TRẮC NGHIỆM & GÕ TỪ (QUIZ)
   ========================================================================= */

export async function generateFirestoreQuiz({
  topicIds,
  questionCount,
  mode,
  direction = "en_vi",
}: {
  topicIds: string[];
  questionCount: number;
  mode: "flip_card" | "multiple_choice" | "typing";
  direction?: "en_vi" | "vi_en";
}) {
  // Lấy các từ vựng từ các chủ đề được chọn
  let allWords: FirestoreWord[] = [];
  for (const tId of topicIds) {
    const snap = await adminDb
      .collection("words")
      .where("topicId", "==", tId)
      .limit(200)
      .get();

    for (const doc of snap.docs) {
      const d = doc.data();
      allWords.push({
        id: doc.id,
        topicId: d.topicId,
        word: d.word,
        wordNormalized: d.wordNormalized,
        partOfSpeech: d.partOfSpeech || null,
        meaning: d.meaning,
        pronunciation: d.pronunciation || null,
        synonyms: d.synonyms || [],
        createdAt: d.createdAt ? d.createdAt.toDate() : new Date(),
      });
    }
  }

  if (allWords.length === 0) {
    return { success: false, error: "Chưa có từ vựng nào trong các chủ đề đã chọn." };
  }

  // Xáo trộn Fisher–Yates
  const shuffledWords = shuffleArray(allWords);
  const selectedCandidates = shuffledWords.slice(0, Math.min(questionCount, shuffledWords.length));

  const questions = selectedCandidates.map((candidate) => {
    if (mode === "multiple_choice") {
      const mc = generateMultipleChoiceOptions({
        correctWord: candidate as QuizWordCandidate,
        allCandidates: allWords as QuizWordCandidate[],
        direction,
      });

      return {
        wordId: candidate.id,
        word: candidate.word,
        meaning: candidate.meaning,
        partOfSpeech: candidate.partOfSpeech,
        pronunciation: candidate.pronunciation,
        synonyms: candidate.synonyms,
        questionText: mc.questionText,
        subText: mc.subText,
        correctAnswer: mc.correctAnswer,
        options: mc.options,
      };
    }

    if (mode === "typing") {
      return {
        wordId: candidate.id,
        word: candidate.word,
        meaning: candidate.meaning,
        partOfSpeech: candidate.partOfSpeech,
        pronunciation: candidate.pronunciation,
        synonyms: candidate.synonyms,
        questionText: candidate.meaning,
        subText: candidate.partOfSpeech || undefined,
        correctAnswer: candidate.word,
      };
    }

    return {
      wordId: candidate.id,
      word: candidate.word,
      meaning: candidate.meaning,
      partOfSpeech: candidate.partOfSpeech,
      pronunciation: candidate.pronunciation,
      synonyms: candidate.synonyms,
      questionText: candidate.word,
      subText: candidate.partOfSpeech || undefined,
      correctAnswer: candidate.meaning,
    };
  });

  return { success: true, questions };
}

export async function submitFirestoreQuiz({
  userId,
  mode,
  topicIds,
  totalQuestions,
  correctAnswers,
  timeSpentSeconds,
  answers,
}: {
  userId: string;
  mode: "flip_card" | "multiple_choice" | "typing";
  topicIds: string[];
  totalQuestions: number;
  correctAnswers: number;
  timeSpentSeconds: number;
  answers: Array<{ wordId: string; userAnswer: string; correctAnswer: string; isCorrect: boolean }>;
}) {
  const scorePercent =
    totalQuestions > 0 ? parseFloat(((correctAnswers / totalQuestions) * 100).toFixed(2)) : 0;

  const attemptRef = adminDb.collection("quiz_attempts").doc();
  await attemptRef.set({
    userId,
    mode,
    topicIds,
    totalQuestions,
    correctAnswers,
    scorePercent,
    timeSpentSeconds,
    answers,
    createdAt: FieldValue.serverTimestamp(),
  });

  return { success: true, attemptId: attemptRef.id, scorePercent };
}
