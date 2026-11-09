import { getRoadmapWithStagesAction } from "@/actions/roadmap";
import { RoadmapHeader } from "@/components/roadmap/RoadmapHeader";
import { StageCard } from "@/components/roadmap/StageCard";
import { AlertCircle, Compass } from "lucide-react";

interface RoadmapPageProps {
  searchParams: Promise<{
    tab?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function RoadmapPage({ searchParams }: RoadmapPageProps) {
  const params = await searchParams;
  const activeTab = params.tab === "ngu-phap" ? "ngu-phap" : "tu-vung";
  const roadmapType = activeTab === "ngu-phap" ? "grammar" : "vocabulary";

  const res = await getRoadmapWithStagesAction(roadmapType);

  if (!res.success || !res.data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold font-serif text-[var(--ink)]">
          {res.error || "Chưa có dữ liệu lộ trình."}
        </h2>
        <p className="text-sm text-[var(--ink-secondary)]">
          Vui lòng thử lại sau hoặc liên hệ quản trị viên để khởi tạo lộ trình học.
        </p>
      </div>
    );
  }

  const { roadmap, stages, overallProgressPercent, completedStagesCount, totalStagesCount } =
    res.data;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header with Track Tabs & Progress */}
      <RoadmapHeader
        activeTab={activeTab}
        roadmapName={roadmap.name}
        targetBand={roadmap.targetBand}
        overallPercent={overallProgressPercent}
        completedStages={completedStagesCount}
        totalStages={totalStagesCount}
      />

      {/* Vertical Milestone Pathway */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-6 text-sm font-semibold text-[var(--ink-secondary)]">
          <Compass className="w-4 h-4 text-[var(--amber)]" />
          <span>Hành trình Chinh phục từng Cột mốc</span>
        </div>

        <div className="relative">
          {stages.map((stage, idx) => (
            <StageCard
              key={stage.id}
              stage={stage}
              type={roadmapType}
              isFirst={idx === 0}
              isLast={idx === stages.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

