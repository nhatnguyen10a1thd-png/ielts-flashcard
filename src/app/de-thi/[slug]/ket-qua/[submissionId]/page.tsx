import { notFound } from "next/navigation";
import { getTestSubmissionResultAction } from "@/actions/test";
import { ExamResultView } from "@/components/test/ExamResultView";

interface PageProps {
  params: Promise<{
    slug: string;
    submissionId: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function TestResultPage({ params }: PageProps) {
  const { submissionId } = await params;
  const res = await getTestSubmissionResultAction(submissionId);

  if (!res.success || !res.data) {
    notFound();
  }

  return <ExamResultView data={res.data} />;
}

