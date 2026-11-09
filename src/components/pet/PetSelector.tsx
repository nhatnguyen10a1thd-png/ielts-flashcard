"use client";

import React, { useState } from "react";
import { PetAvatar } from "./PetAvatar";
import { PetStage, PetSpeciesId, UserPet, PetSpecies } from "@/db/schema";
import { adoptPetAction, setActivePetAction, renamePetAction } from "@/actions/pet";
import { STAGE_DETAILS, StageDetail } from "@/lib/pet/streak-calculator";
import { Check, Edit3, Flame, Lock, Plus, Sparkles, Star } from "lucide-react";

interface PetSelectorProps {
  userPets: Array<{ pet: UserPet; species: PetSpecies; stageDetail: StageDetail }>;
  speciesCatalog: Array<PetSpecies & { isUnlocked: boolean; isAdopted: boolean }>;
  highestStreak: number;
  onPetChanged?: () => void;
}

export function PetSelector({
  userPets,
  speciesCatalog,
  highestStreak,
  onPetChanged,
}: PetSelectorProps) {
  const [isAdoptingOpen, setIsAdoptingOpen] = useState(false);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string>("cat");
  const [petNameInput, setPetNameInput] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Rename state
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState<string>("");

  const activePet = userPets.find((p) => p.pet.isActive);

  const handleAdopt = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await adoptPetAction({
        speciesId: selectedSpeciesId,
        petName: petNameInput,
      });

      if (res.success) {
        setIsAdoptingOpen(false);
        setPetNameInput("");
        if (onPetChanged) onPetChanged();
      } else {
        setErrorMsg(res.error || "Không thể nhận trứng.");
      }
    } catch {
      setErrorMsg("Đã xảy ra lỗi kết nối.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = async (petId: string) => {
    setLoading(true);
    try {
      const res = await setActivePetAction(petId);
      if (res.success && onPetChanged) {
        onPetChanged();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async (petId: string) => {
    if (!renameInput.trim()) return;
    setLoading(true);
    try {
      const res = await renamePetAction(petId, renameInput);
      if (res.success) {
        setEditingPetId(null);
        if (onPetChanged) onPetChanged();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. SECTION: MY PETS COLLECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-lg text-[var(--ink)]">
              Thú cưng đã sở hữu ({userPets.length})
            </h3>
            <p className="text-xs text-[var(--ink-secondary)]">
              Chuyển đổi linh hoạt giữa các thú cưng đồng hành cùng bạn
            </p>
          </div>

          <button
            onClick={() => {
              // Find first available unlocked and unadopted species
              const firstAvail = speciesCatalog.find((s) => s.isUnlocked && !s.isAdopted);
              if (firstAvail) setSelectedSpeciesId(firstAvail.id);
              setIsAdoptingOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[var(--navy)] text-white hover:bg-[var(--navy-hover)] transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ấp thêm trứng mới</span>
          </button>
        </div>

        {userPets.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-[var(--border-medium)] bg-[var(--surface-raised)] space-y-3">
            <PetAvatar species="owl" stage="egg" size={70} className="mx-auto" />
            <p className="text-sm font-serif font-bold text-[var(--ink)]">
              Bạn chưa có quả trứng thú cưng nào
            </p>
            <p className="text-xs text-[var(--ink-secondary)] max-w-sm mx-auto">
              Hãy chọn ngay một quả trứng để bắt đầu chuỗi ngày học IELTS đầy cảm hứng nhé!
            </p>
            <button
              onClick={() => setIsAdoptingOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--navy)] text-white hover:bg-[var(--navy-hover)] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Nhận quả trứng đầu tiên</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {userPets.map(({ pet, species, stageDetail }) => {
              const isCurrentActive = pet.isActive;
              const isEditing = editingPetId === pet.id;

              return (
                <div
                  key={pet.id}
                  className={`p-4 rounded-xl border transition-all flex items-start gap-4 ${
                    isCurrentActive
                      ? "border-amber-500/60 bg-amber-500/5 shadow-xs ring-1 ring-amber-500/30"
                      : "border-[var(--border-light)] bg-[var(--surface)] hover:border-[var(--border-medium)]"
                  }`}
                >
                  <div className="shrink-0">
                    <PetAvatar species={species.id} stage={pet.stage} size={64} />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Pet name & rename */}
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={renameInput}
                          onChange={(e) => setRenameInput(e.target.value)}
                          maxLength={30}
                          className="w-full text-xs px-2 py-1 rounded border border-[var(--border-medium)] bg-[var(--surface)] text-[var(--ink)] focus:outline-hidden focus:ring-1 focus:ring-[var(--navy)]"
                          placeholder="Tên mới..."
                          autoFocus
                        />
                        <button
                          onClick={() => handleRename(pet.id)}
                          className="px-2 py-1 text-xs rounded bg-[var(--navy)] text-white hover:bg-[var(--navy-hover)]"
                        >
                          Lưu
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif font-bold text-sm text-[var(--ink)] truncate">
                          {pet.petName}
                        </h4>
                        <button
                          onClick={() => {
                            setEditingPetId(pet.id);
                            setRenameInput(pet.petName);
                          }}
                          className="text-[var(--ink-muted)] hover:text-[var(--ink)] p-0.5"
                          title="Đổi tên thú cưng"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-[11px] text-[var(--ink-secondary)]">
                      <span className="font-medium text-[var(--navy)]">{species.name}</span>
                      <span>•</span>
                      <span>{stageDetail.label} {stageDetail.emoji}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs pt-1">
                      <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                        <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>{pet.currentStreak} ngày</span>
                      </span>

                      <span className="text-[11px] text-[var(--ink-muted)]">
                        Kỷ lục: {pet.longestStreak} ngày
                      </span>
                    </div>

                    {/* Active toggle button */}
                    <div className="pt-2">
                      {isCurrentActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <Check className="w-3.5 h-3.5" />
                          <span>Đang đồng hành</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetActive(pet.id)}
                          disabled={loading}
                          className="text-[11px] font-semibold text-[var(--navy)] hover:underline"
                        >
                          Chọn làm bạn đồng hành →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. SECTION: ALL SPECIES CATALOG & UNLOCK PROGRESS */}
      <div className="space-y-4 pt-4 border-t border-[var(--border-light)]">
        <div>
          <h3 className="font-serif font-bold text-lg text-[var(--ink)]">
            Bách khoa loài Thú Cưng ({speciesCatalog.length})
          </h3>
          <p className="text-xs text-[var(--ink-secondary)]">
            Kỷ lục streak hiện tại của bạn: <strong className="text-amber-500">{highestStreak} ngày</strong>. Duy trì streak để mở khoá các linh vật huyền thoại!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {speciesCatalog.map((spec) => {
            const isUnlocked = spec.isUnlocked;
            const isAdopted = spec.isAdopted;

            return (
              <div
                key={spec.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  !isUnlocked
                    ? "border-[var(--border-light)] bg-[var(--surface-raised)]/60 opacity-75"
                    : "border-[var(--border-light)] bg-[var(--surface)] hover:border-[var(--border-medium)]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <PetAvatar
                      species={spec.id}
                      stage={isUnlocked ? "adult" : "egg"}
                      size={54}
                    />
                    {!isUnlocked && (
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white">
                        <Lock className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-serif font-bold text-sm text-[var(--ink)]">
                        {spec.name}
                      </h4>
                      {isUnlocked && (
                        <span className="text-[10px] text-amber-500">
                          <Star className="w-3 h-3 fill-amber-500 inline" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--ink-secondary)] line-clamp-2">
                      {spec.description}
                    </p>
                  </div>
                </div>

                {/* Footer action / condition */}
                <div className="mt-4 pt-3 border-t border-[var(--border-light)] flex items-center justify-between text-xs">
                  {isUnlocked ? (
                    isAdopted ? (
                      <span className="text-[11px] font-medium text-[var(--ink-muted)]">
                        Đã sở hữu
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedSpeciesId(spec.id);
                          setIsAdoptingOpen(true);
                        }}
                        className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
                      >
                        Ấp trứng loài này →
                      </button>
                    )
                  ) : (
                    <div className="text-[11px] font-semibold text-[var(--burgundy)] flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>
                        Cần streak{" "}
                        {spec.unlockCondition === "streak_7"
                          ? "7 ngày"
                          : spec.unlockCondition === "streak_14"
                          ? "14 ngày"
                          : spec.unlockCondition === "streak_30"
                          ? "30 ngày"
                          : "đặc biệt"}
                      </span>
                    </div>
                  )}

                  <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--ink-muted)]">
                    {spec.id}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. MODAL: ADOPT NEW EGG */}
      {isAdoptingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border-medium)] shadow-xl space-y-5">
            <div className="text-center space-y-1">
              <h3 className="font-serif font-bold text-xl text-[var(--ink)]">
                Ấp một Quả Trứng Thú Cưng
              </h3>
              <p className="text-xs text-[var(--ink-secondary)]">
                Chọn loài linh vật và đặt một cái tên đáng yêu cho người bạn mới!
              </p>
            </div>

            {/* Species picker chips */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--ink)]">
                Chọn loài thú cưng:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {speciesCatalog
                  .filter((s) => s.isUnlocked)
                  .map((s) => {
                    const isSelected = selectedSpeciesId === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedSpeciesId(s.id)}
                        className={`p-2 rounded-lg border text-center transition-all flex flex-col items-center gap-1.5 ${
                          isSelected
                            ? "border-amber-500 bg-amber-500/10 font-bold text-[var(--ink)]"
                            : "border-[var(--border-light)] hover:bg-[var(--surface-raised)] text-[var(--ink-secondary)]"
                        }`}
                      >
                        <PetAvatar species={s.id} stage="egg" size={38} />
                        <span className="text-[11px] truncate w-full">{s.name}</span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Pet Preview */}
            <div className="p-4 rounded-xl bg-[var(--surface-raised)] text-center flex flex-col items-center gap-2">
              <PetAvatar species={selectedSpeciesId} stage="egg" size={70} />
              <span className="text-xs font-serif italic text-[var(--ink-secondary)]">
                Quả trứng sẽ nở khi bạn đạt streak 4 ngày!
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleAdopt} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--ink)]">
                  Đặt tên cho thú cưng:
                </label>
                <input
                  type="text"
                  required
                  maxLength={30}
                  value={petNameInput}
                  onChange={(e) => setPetNameInput(e.target.value)}
                  placeholder="Ví dụ: Bé Miu Miu, Cú Bác Học..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-medium)] bg-[var(--surface)] text-[var(--ink)] placeholder-[var(--ink-muted)] focus:outline-hidden focus:ring-2 focus:ring-[var(--navy)]"
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-[var(--burgundy)] font-medium">{errorMsg}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdoptingOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-[var(--border-medium)] hover:bg-[var(--surface-raised)] text-[var(--ink)]"
                >
                  Huỷ bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading || !petNameInput.trim()}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--navy)] text-white hover:bg-[var(--navy-hover)] disabled:opacity-50 transition-colors shadow-xs"
                >
                  {loading ? "Đang tạo..." : "Xác nhận nhận trứng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

