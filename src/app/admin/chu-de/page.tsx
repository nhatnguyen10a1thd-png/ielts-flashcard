import { db } from "@/db";
import { topics, words } from "@/db/schema";
import { sql, eq, desc } from "drizzle-orm";
import { TopicManager } from "./TopicManager";

export const dynamic = "force-dynamic";

export default async function AdminTopicsPage() {
  // Query all topics (including soft-deleted) with count of words
  const rows = await db
    .select({
      id: topics.id,
      name: topics.name,
      slug: topics.slug,
      description: topics.description,
      isVisible: topics.isVisible,
      deletedAt: topics.deletedAt,
      createdAt: topics.createdAt,
      wordCount: sql<number>`count(${words.id})`,
    })
    .from(topics)
    .leftJoin(words, eq(topics.id, words.topicId))
    .groupBy(topics.id)
    .orderBy(desc(topics.createdAt));

  const initialTopics = rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    isVisible: r.isVisible,
    deletedAt: r.deletedAt ? r.deletedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    wordCount: Number(r.wordCount || 0),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif font-bold text-[var(--ink)]">
          Quản lý Chủ đề Từ vựng
        </h2>
        <p className="text-xs text-[var(--ink-secondary)] mt-1">
          Tạo, chỉnh sửa, ẩn/hiện hoặc quản lý các chủ đề đã xoá tạm thời trong vòng 30 ngày.
        </p>
      </div>

      <TopicManager initialTopics={initialTopics} />
    </div>
  );
}

