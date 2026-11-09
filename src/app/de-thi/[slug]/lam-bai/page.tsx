import { notFound } from "next/navigation";
import { getTestForExamAction } from "@/actions/test";
import { ExamRoom } from "@/components/test/ExamRoom";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function ExamRoomPage({ params }: PageProps) {
  const { slug } = await params;
  const res = await getTestForExamAction(slug);

  if (!res.success || !res.data) {
    notFound();
  }

  return <ExamRoom test={res.data.test} questions={res.data.questions} />;
}

