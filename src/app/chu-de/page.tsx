import { db } from "@/db";
import { topics, words, userWordProgress } from "@/db/schema";
import { sql, eq, and, isNull, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import Link from "next/link";
import {
  BookOpen,
  Brain,
  Search,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FolderKanban,
} from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export default async function TopicsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const searchQuery = params.q?.trim() || "";
  const session = await getSession();

  // Truy vấn danh sách chủ đề đang hiển thị kèm số từ vựng
  const topicRows = await db
    .select({
      id: topics.id,
      name: topics.name,
      slug: topics.slug,
      description: topics.description,
      wordCount: sql<number>`count(distinct ${words.id})`,
    })
    .from(topics)
    .leftJoin(words, eq(topics.id, words.topicId))
    .where(
      and(
        eq(topics.isVisible, true),
        isNull(topics.deletedAt),
        searchQuery
          ? sql`(${topics.name} ILIKE ${`%${searchQuery}%`} OR ${topics.description} ILIKE ${`%${searchQuery}%`})`
          : undefined
      )
    )
    .groupBy(topics.id)
    .orderBy(desc(topics.createdAt));

  // Nếu người dùng đã đăng nhập, lấy số từ đã thuộc theo từng chủ đề
  const progressMap = new Map<string, number>();

  if (session) {
    const progressRows = await db
      .select({
        topicId: words.topicId,
        knownCount: sql<number>`count(distinct ${userWordProgress.wordId})`,
      })
      .from(userWordProgress)
      .innerJoin(words, eq(userWordProgress.wordId, words.id))
      .where(
        and(
          eq(userWordProgress.userId, session.userId),
          eq(userWordProgress.isKnown, true)
        )
      )
      .groupBy(words.topicId);

    progressRows.forEach((r) => {
      progressMap.set(r.topicId, Number(r.knownCount || 0));
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--border-light)]">
        <div>
          <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-[var(--surface-raised)] text-[var(--navy)] rounded-full mb-2">
            Học phần từ vựng
          </span>
          <h1 className="text-3xl font-serif font-bold text-[var(--ink)]">
            Danh mục Bộ Từ vựng
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[var(--ink-secondary)]">
            Chọn một chủ đề bên dưới để bắt đầu học flashcard hai chiều hoặc làm bài kiểm tra.
          </p>
        </div>

        {/* Search Bar */}
        <form className="relative w-full md:w-72">
          <input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder="Tìm kiếm chủ đề..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--surface)] border border-[var(--border-medium)] rounded-md text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--navy)]"
          />
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--ink-muted)]">
            <Search className="w-3.5 h-3.5" />
          </span>
        </form>
      </div>

      {/* Grid of Topics */}
      {topicRows.length === 0 ? (
        <div className="p-12 text-center rounded-lg bg-[var(--surface)] border border-[var(--border-light)] text-xs text-[var(--ink-muted)]">
          {searchQuery ? "Không tìm thấy chủ đề nào phù hợp với từ khoá tìm kiếm." : "Chưa có chủ đề nào được công khai."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topicRows.map((topic) => {
            const wordCount = Number(topic.wordCount || 0);
            const knownCount = progressMap.get(topic.id) || 0;
            const progressPercent = wordCount > 0 ? Math.round((knownCount / wordCount) * 100) : 0;

            return (
              <div
                key={topic.id}
                className="group flex flex-col justify-between p-6 rounded-lg bg-[var(--surface)] border border-[var(--border-light)] hover:border-[var(--navy)]/40 hover:shadow-xs transition-all space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-md bg-[var(--surface-raised)] text-[var(--navy)]">
                      <FolderKanban className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-semibold text-[var(--ink-secondary)]">
                      {wordCount.toLocaleString("vi-VN")} từ
                    </span>
                  </div>

                  <div>
                    <h2 className="text-lg font-serif font-bold text-[var(--ink)] group-hover:text-[var(--navy)] transition-colors">
                      <Link href={`/chu-de/${topic.slug}`}>
                        {topic.name}
                      </Link>
                    </h2>
                    <p className="mt-1 text-xs text-[var(--ink-secondary)] line-clamp-2 leading-relaxed">
                      {topic.description || "Chủ đề học từ vựng chuyên sâu."}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-2 border-t border-[var(--border-light)]">
                  {/* Progress bar if logged in */}
                  {session ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-[var(--ink-secondary)]">
                        <span>Đã thuộc</span>
                        <span className="font-semibold text-[var(--navy)]">
                          {knownCount} / {wordCount} từ ({progressPercent}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[var(--surface-raised)] overflow-hidden">
                        <div
                          className="h-full bg-[var(--sage)] transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-[var(--ink-muted)] italic">
                      Đăng nhập để theo dõi tiến độ ghi nhớ
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/chu-de/${topic.slug}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-md bg-[var(--navy)] text-[#faf7f2] hover:bg-[var(--navy-hover)] text-xs font-semibold transition-colors shadow-xs"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Học Flashcard</span>
                    </Link>

                    {wordCount >= 4 && (
                      <Link
                        href={`/kiem-tra?topic=${topic.id}`}
                        className="inline-flex items-center justify-center p-2 rounded-md border border-[var(--border-medium)] bg-[var(--surface)] hover:bg-[var(--surface-raised)] text-[var(--burgundy)] hover:text-[var(--burgundy-hover)] transition-colors"
                        title="Kiểm tra chủ đề này"
                      >
                        <Brain className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

