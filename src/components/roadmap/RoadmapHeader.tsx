"use client";

import Link from "next/link";
import { OwlMascot } from "@/components/owl/OwlMascot";
import { BookOpen, Layers, Sparkles, Trophy, CheckCircle2 } from "lucide-react";

interface RoadmapHeaderProps {
  activeTab: "tu-vung" | "ngu-phap";
  roadmapName: string;
  targetBand: string | null;
  overallPercent: number;
  completedStages: number;
  totalStages: number;
}

export function RoadmapHeader({
  activeTab,
  roadmapName,
  targetBand,
  overallPercent,
  completedStages,
  totalStages,
}: RoadmapHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--surface-raised)] to-[var(--surface)] border border-[var(--border-light)] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--amber)]/10 text-[var(--amber-dark)] text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Target Band: {targetBand || "6.5 - 7.5+"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--ink)]">
              {roadmapName}
            </h1>
            <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
              {activeTab === "tu-vung"
                ? "Lộ trình từ vựng bài bản chuẩn hóa theo từng Target Band, giúp bạn mở khóa từng nấc thang kiến thức một cách khoa học."
                : "Hệ thống chuyên đề ngữ pháp thực chiến IELTS, tối ưu điểm Grammatical Range & Accuracy cho Writing và Speaking."}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-[var(--surface)]/80 backdrop-blur-xs p-4 rounded-xl border border-[var(--border-light)] self-stretch sm:self-auto justify-between sm:justify-start">
            <OwlMascot variant="cheering" size={64} />
            <div className="space-y-1">
              <div className="text-xs text-[var(--ink-muted)] font-medium">Tiến độ lộ trình</div>
              <div className="text-xl font-bold font-serif text-[var(--navy)]">
                {completedStages}/{totalStages} Chặng
              </div>
              <div className="w-28 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--amber)] transition-all duration-500 rounded-full"
                  style={{ width: `${overallPercent}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold text-[var(--amber-dark)]">
                {overallPercent}% hoàn thành
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Track Selector Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-[var(--surface-raised)] rounded-xl border border-[var(--border-light)] w-full sm:w-fit">
        <Link
          href="/lo-trinh?tab=tu-vung"
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "tu-vung"
              ? "bg-[var(--surface)] text-[var(--navy)] font-semibold shadow-xs border border-[var(--border-light)]"
              : "text-[var(--ink-secondary)] hover:text-[var(--ink)]"
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-600" />
          <span>Lộ trình Từ vựng</span>
        </Link>

        <Link
          href="/lo-trinh?tab=ngu-phap"
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "ngu-phap"
              ? "bg-[var(--surface)] text-[var(--navy)] font-semibold shadow-xs border border-[var(--border-light)]"
              : "text-[var(--ink-secondary)] hover:text-[var(--ink)]"
          }`}
        >
          <Layers className="w-4 h-4 text-amber-600" />
          <span>Lộ trình Ngữ pháp</span>
        </Link>
      </div>
    </div>
  );
}
