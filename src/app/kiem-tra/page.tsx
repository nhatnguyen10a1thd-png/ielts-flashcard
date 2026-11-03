import { db } from "@/db";
import { topics, words } from "@/db/schema";
import { sql, eq, and, isNull } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { QuizSetup } from "./QuizSetup";
import { Brain } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kiểm tra Từ vựng IELTS - Trộn đề ngẫu nhiên",
  description: "Làm bài kiểm tra từ vựng bằng trắc nghiệm 4 đáp án, gõ từ tiếng Anh hoặc lật thẻ tự đánh giá.",
};

interface PageProps {
  searchParams: Promise<{
    topic?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function QuizPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const preselectedTopicId = params.topic || undefined;
  const session = await getSession();

  // Lấy các chủ đề có ít nhất 1 từ vựng
  const topicRows = await db
    .select({
      id: topics.id,
      name: topics.name,
      wordCount: sql<number>`count(${words.id})`,
    })
    .from(topics)
    .innerJoin(words, eq(topics.id, words.topicId))
    .where(and(eq(topics.isVisible, true), isNull(topics.deletedAt)))
    .groupBy(topics.id)
    .orderBy(topics.name);

  const topicOptions = topicRows.map((t) => ({
    id: t.id,
    name: t.name,
    wordCount: Number(t.wordCount || 0),
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-2 pb-6 border-b border-[var(--border-light)]">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-raised)] text-[var(--navy)] text-xs font-semibold uppercase tracking-wider mb-2">
          <Brain className="w-3.5 h-3.5" />
          <span>Kiểm tra & Củng cố</span>
        </div>
        <h1 className="text-3xl font-serif font-bold text-[var(--ink)]">
          Kiểm tra Kiến thức Từ vựng
        </h1>
        <p className="text-xs sm:text-sm text-[var(--ink-secondary)] max-w-xl mx-auto">
          Thuật toán Fisher–Yates xáo trộn câu hỏi và đáp án ngẫu nhiên mỗi lần thi. Hỗ trợ trộn nhiều chủ đề và tự động cập nhật độ thuộc từ vựng.
        </p>
      </div>

      <QuizSetup
        topics={topicOptions}
        preselectedTopicId={preselectedTopicId}
        isLoggedIn={Boolean(session)}
      />
    </div>
  );
}

