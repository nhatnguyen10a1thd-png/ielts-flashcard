"use client";

import React from "react";
import { Flame } from "lucide-react";

interface StreakBadgeProps {
  count: number;
  isTodayCompleted?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

export function StreakBadge({
  count,
  isTodayCompleted = false,
  size = "md",
  className = "",
  showLabel = false,
}: StreakBadgeProps) {
  let sizeClasses = "px-2 py-0.5 text-xs gap-1";
  let iconSize = "w-3.5 h-3.5";

  if (size === "sm") {
    sizeClasses = "px-1.5 py-0.5 text-[11px] gap-1";
    iconSize = "w-3 h-3";
  } else if (size === "lg") {
    sizeClasses = "px-3.5 py-1.5 text-sm gap-2";
    iconSize = "w-5 h-5";
  }

  // Visual style according to completion
  const isGlowing = count > 0 && isTodayCompleted;

  return (
    <div
      className={`inline-flex items-center rounded-full font-bold transition-all shadow-2xs select-none ${
        isGlowing
          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40"
          : count > 0
          ? "bg-[var(--surface-raised)] text-[var(--ink-secondary)] border border-[var(--border-medium)]"
          : "bg-[var(--surface-raised)] text-[var(--ink-muted)] border border-[var(--border-light)]"
      } ${sizeClasses} ${className}`}
      title={
        isTodayCompleted
          ? `Chuỗi ${count} ngày học liên tục (Đã hoàn thành hôm nay!)`
          : `Chuỗi ${count} ngày học liên tục (Chưa học hôm nay)`
      }
    >
      <Flame
        className={`${iconSize} shrink-0 ${
          isGlowing
            ? "text-amber-500 fill-amber-500 animate-pulse"
            : count > 0
            ? "text-amber-600/70"
            : "text-[var(--ink-muted)]"
        }`}
      />
      <span>{count}</span>
      {showLabel && <span className="font-medium text-[11px] opacity-80">ngày</span>}
    </div>
  );
}

