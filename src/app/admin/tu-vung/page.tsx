import { db } from "@/db";
import { words, topics } from "@/db/schema";
import { sql, eq, and, desc, isNull, or, ilike } from "drizzle-orm";
import { WordManager } from "./WordManager";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    topic?: string;
    q?: string;
  }>;
}

const PAGE_SIZE = 25;

export default async function AdminWordsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10));
  const selectedTopicId = params.topic || undefined;
  const searchQuery = params.q?.trim() || undefined;

  // Lấy danh sách tất cả chủ đề đang hoạt động để làm bộ lọc
  const activeTopics = await db
    .select({
      id: topics.id,
      name: topics.name,
    })
    .from(topics)
    .where(isNull(topics.deletedAt))
    .orderBy(topics.name);

  // Xây dựng điều kiện lọc
  const conditions = [];

  if (selectedTopicId) {
    conditions.push(eq(words.topicId, selectedTopicId));
  }

  if (searchQuery) {
    // Tìm kiếm từ vựng bằng chỉ mục ILIKE / GIN trigram
    const term = `%${searchQuery}%`;
    conditions.push(
      or(
        ilike(words.word, term),
        ilike(words.meaning, term),
        ilike(words.wordNormalized, term)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Đếm tổng số từ thoả mãn điều kiện
  const [countRes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(words)
    .where(whereClause);

  const totalWords = Number(countRes?.count || 0);
  const totalPages = Math.ceil(totalWords / PAGE_SIZE) || 1;

  // Lấy dữ liệu phân trang
  const rows = await db
    .select({
      id: words.id,
      topicId: words.topicId,
      word: words.word,
      wordNormalized: words.wordNormalized,
      partOfSpeech: words.partOfSpeech,
      meaning: words.meaning,
      pronunciation: words.pronunciation,
      synonyms: words.synonyms,
      createdAt: words.createdAt,
      topicName: topics.name,
    })
    .from(words)
    .leftJoin(topics, eq(words.topicId, topics.id))
    .where(whereClause)
    .orderBy(desc(words.createdAt))
    .limit(PAGE_SIZE)
    .offset((currentPage - 1) * PAGE_SIZE);

  const wordItems = rows.map((r) => ({
    id: r.id,
    topicId: r.topicId,
    topicName: r.topicName || "Chưa phân loại",
    word: r.word,
    wordNormalized: r.wordNormalized,
    partOfSpeech: r.partOfSpeech,
    meaning: r.meaning,
    pronunciation: r.pronunciation,
    synonyms: r.synonyms as string[] | null,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif font-bold text-[var(--ink)]">
          Quản lý Từ vựng Chi tiết
        </h2>
        <p className="text-xs text-[var(--ink-secondary)] mt-1">
          Xem, tra cứu, thêm mới, sửa hoặc xoá từ vựng. Hệ thống tối ưu tìm kiếm cực nhanh với PostgreSQL.
        </p>
      </div>

      <WordManager
        words={wordItems}
        topics={activeTopics}
        totalWords={totalWords}
        currentPage={currentPage}
        totalPages={totalPages}
        selectedTopicId={selectedTopicId}
        searchQuery={searchQuery}
      />
    </div>
  );
}

