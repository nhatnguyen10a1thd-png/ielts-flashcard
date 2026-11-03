import { db } from "@/db";
import { topics, words, userWordProgress } from "@/db/schema";
import { eq, and, isNull, asc, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FlashcardPlayer } from "@/components/flashcard/FlashcardPlayer";
import { StudyWordItem } from "@/actions/study";
import { ArrowLeft, Brain } from "lucide-react";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [topic] = await db
    .select({ name: topics.name, description: topics.description })
    .from(topics)
    .where(and(eq(topics.slug, slug), isNull(topics.deletedAt)))
    .limit(1);

  if (!topic) return { title: "Không tìm thấy chủ đề" };

  return {
    title: `Học Flashcard: ${topic.name} - IELTS Flashcard`,
    description: topic.description || "Học từ vựng flashcard hai chiều.",
  };
}

export default async function TopicStudyPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await getSession();

  // Tìm chủ đề
  const [topic] = await db
    .select({
      id: topics.id,
      name: topics.name,
      slug: topics.slug,
      description: topics.description,
      isVisible: topics.isVisible,
    })
    .from(topics)
    .where(and(eq(topics.slug, slug), isNull(topics.deletedAt)))
    .limit(1);

  if (!topic || (!topic.isVisible && session?.role !== "admin")) {
    notFound();
  }

  // Lấy toàn bộ từ vựng kèm trạng thái thuộc của học viên (nếu đã đăng nhập)
  const rows = await db
    .select({
      id: words.id,
      topicId: words.topicId,
      word: words.word,
      partOfSpeech: words.partOfSpeech,
      meaning: words.meaning,
      pronunciation: words.pronunciation,
      synonyms: words.synonyms,
      isKnown: userWordProgress.isKnown,
      reviewCount: userWordProgress.reviewCount,
    })
    .from(words)
    .leftJoin(
      userWordProgress,
      and(
        eq(words.id, userWordProgress.wordId),
        session ? eq(userWordProgress.userId, session.userId) : sql`1=0`
      )
    )
    .where(eq(words.topicId, topic.id))
    .orderBy(asc(words.wordNormalized));

  const studyWords: StudyWordItem[] = rows.map((r) => ({
    id: r.id,
    topicId: r.topicId,
    word: r.word,
    partOfSpeech: r.partOfSpeech,
    meaning: r.meaning,
    pronunciation: r.pronunciation,
    synonyms: (r.synonyms || []) as string[],
    isKnown: Boolean(r.isKnown),
    reviewCount: Number(r.reviewCount || 0),
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Breadcrumb & Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/chu-de"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-secondary)] hover:text-[var(--ink)] font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Danh mục chủ đề</span>
        </Link>

        {studyWords.length >= 4 && (
          <Link
            href={`/kiem-tra?topic=${topic.id}`}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--burgundy)] hover:underline font-semibold"
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Làm bài kiểm tra chủ đề này</span>
          </Link>
        )}
      </div>

      {/* Topic Title */}
      <div className="text-center space-y-1 pb-2">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--ink)]">
          {topic.name}
        </h1>
        {topic.description && (
          <p className="text-xs text-[var(--ink-secondary)] max-w-lg mx-auto">
            {topic.description}
          </p>
        )}
      </div>

      {/* Flashcard Player */}
      <FlashcardPlayer
        topic={topic}
        initialWords={studyWords}
        isLoggedIn={Boolean(session)}
      />
    </div>
  );
}
