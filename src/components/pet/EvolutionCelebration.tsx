"use client";

import React from "react";
import { PetAvatar } from "./PetAvatar";
import { PetStage, PetSpeciesId } from "@/db/schema";
import { STAGE_DETAILS } from "@/lib/pet/streak-calculator";
import { Sparkles, Trophy, X } from "lucide-react";

interface EvolutionCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  petName: string;
  speciesId: PetSpeciesId | string;
  newStage: PetStage | string;
  streak: number;
}

export function EvolutionCelebration({
  isOpen,
  onClose,
  petName,
  speciesId,
  newStage,
  streak,
}: EvolutionCelebrationProps) {
  if (!isOpen) return null;

  const stageDetail = STAGE_DETAILS[newStage as PetStage] || STAGE_DETAILS.egg;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 sm:p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border-medium)] text-center shadow-2xl space-y-6 overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-raised)] transition-colors"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 animate-bounce">
          <Trophy className="w-6 h-6" />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tiến hoá thành công!</span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-[var(--ink)]">
            {petName} đã vươn tầm mới!
          </h2>
          <p className="text-xs text-[var(--ink-secondary)]">
            Chuỗi ngày học liên tục đạt mốc <strong className="text-amber-500">{streak} ngày</strong>.
          </p>
        </div>

        {/* Big Pet Avatar with Ring */}
        <div className="relative py-2 flex justify-center">
          <div className="p-4 rounded-full bg-[var(--surface-raised)] border-2 border-amber-400/50 shadow-inner">
            <PetAvatar species={speciesId} stage={newStage} size={130} />
          </div>
        </div>

        {/* Stage Badge & Description */}
        <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-light)] text-left space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-serif font-bold text-sm text-[var(--navy)]">
              Hình thái: {stageDetail.label} {stageDetail.emoji}
            </span>
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
              Cấp {newStage === "egg" ? 1 : newStage === "hatchling" ? 2 : newStage === "baby" ? 3 : newStage === "teen" ? 4 : newStage === "adult" ? 5 : 6}
            </span>
          </div>
          <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
            {stageDetail.description}
          </p>
        </div>

        {/* Continue Button */}
        <button
          onClick={onClose}
          className="w-full py-3 px-4 rounded-xl bg-[var(--navy)] text-white hover:bg-[var(--navy-hover)] text-sm font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
        >
          Cùng {petName} tiếp tục chinh phục IELTS!
        </button>
      </div>
    </div>
  );
}

