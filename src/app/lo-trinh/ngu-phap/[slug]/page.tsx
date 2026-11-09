import { notFound } from "next/navigation";
import { getGrammarLessonDetailAction } from "@/actions/grammar";
import { GrammarLessonView } from "@/components/roadmap/GrammarLessonView";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function GrammarLessonPage({ params }: PageProps) {
  const { slug } = await params;
  const res = await getGrammarLessonDetailAction(slug);

  if (!res.success || !res.data) {
    notFound();
  }

  return <GrammarLessonView data={res.data} />;
}

