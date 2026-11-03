"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createWordAction,
  updateWordAction,
  deleteWordAction,
} from "@/actions/admin-words";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Volume2,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export interface WordItem {
  id: string;
  topicId: string;
  topicName: string;
  word: string;
  wordNormalized: string;
  partOfSpeech: string | null;
  meaning: string;
  pronunciation: string | null;
  synonyms: string[] | null;
  createdAt: string;
}

export interface TopicOption {
  id: string;
  name: string;
}

interface WordManagerProps {
  words: WordItem[];
  topics: TopicOption[];
  totalWords: number;
  currentPage: number;
  totalPages: number;
  selectedTopicId?: string;
  searchQuery?: string;
}

export function WordManager({
  words,
  topics,
  totalWords,
  currentPage,
  totalPages,
  selectedTopicId,
  searchQuery,
}: WordManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchQuery || "");
  const [topicFilter, setTopicFilter] = useState(selectedTopicId || "");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<WordItem | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isPending, setIsPending] = useState(false);

  const applyFilters = (newTopic: string, newSearch: string, page = 1) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newTopic) params.set("topic", newTopic);
    else params.delete("topic");

    if (newSearch.trim()) params.set("q", newSearch.trim());
    else params.delete("q");

    params.set("page", page.toString());
    router.push(`/admin/tu-vung?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(topicFilter, search, 1);
  };

  const handleTopicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextTopic = e.target.value;
    setTopicFilter(nextTopic);
    applyFilters(nextTopic, search, 1);
  };

  const playPronunciation = (word: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleOpenCreate = () => {
    setEditingWord(null);
    setErrorMsg("");
    setSuccessMsg("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (word: WordItem) => {
    setEditingWord(word);
    setErrorMsg("");
    setSuccessMsg("");
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setErrorMsg("");
    setSuccessMsg("");

    const formData = new FormData(e.currentTarget);

    let res;
    if (editingWord) {
      formData.set("id", editingWord.id);
      res = await updateWordAction(null, formData);
    } else {
      res = await createWordAction(null, formData);
    }

    setIsPending(false);

    if (res.success) {
      setSuccessMsg(editingWord ? "Cập nhật từ thành công!" : "Thêm từ mới thành công!");
      setIsModalOpen(false);
      router.refresh();
    } else {
      setErrorMsg(res.error || "Đã xảy ra lỗi.");
    }
  };

  const handleDelete = async (word: WordItem) => {
    if (!confirm(`Bạn có chắc chắn muốn xoá vĩnh viễn từ "${word.word}"? Dữ liệu tiến độ học viên liên quan sẽ bị xoá cascade.`)) {
      return;
    }
    const res = await deleteWordAction(word.id);
    if (res.success) {
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Topic Select */}
          <select
            value={topicFilter}
            onChange={handleTopicChange}
            className="px-3 py-2 text-xs bg-[var(--surface)] border border-[var(--border-medium)] rounded-md text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--navy)]"
          >
            <option value="">-- Tất cả chủ đề ({totalWords.toLocaleString("vi-VN")} từ) --</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo từ vựng hoặc nghĩa..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-[var(--surface)] border border-[var(--border-medium)] rounded-md text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--navy)]"
            />
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[var(--ink-muted)]">
              <Search className="w-3.5 h-3.5" />
            </span>
          </form>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[var(--navy)] text-[#faf7f2] hover:bg-[var(--navy-hover)] text-xs font-medium transition-colors shadow-xs whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm từ mới</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-[var(--sage-light)] border border-[var(--sage)]/30 rounded-md flex items-center gap-2 text-xs text-[var(--sage)] font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Words Table */}
      <div className="bg-[var(--surface)] border border-[var(--border-light)] rounded-lg overflow-hidden shadow-xs">
        {words.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--ink-muted)]">
            Không tìm thấy từ vựng nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-raised)] text-[var(--ink-secondary)] border-b border-[var(--border-light)]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Từ vựng (Word)</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Loại từ</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Nghĩa tiếng Việt</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Phát âm</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Từ đồng nghĩa</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Chủ đề</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light)]">
                {words.map((w) => (
                  <tr key={w.id} className="hover:bg-[var(--surface-raised)]/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-sm text-[var(--ink)]">
                          {w.word}
                        </span>
                        <button
                          onClick={() => playPronunciation(w.word)}
                          title="Nghe phát âm"
                          className="p-1 text-[var(--ink-muted)] hover:text-[var(--navy)] rounded transition-colors"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {w.partOfSpeech ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--surface-raised)] text-[var(--ink-secondary)] italic">
                          {w.partOfSpeech}
                        </span>
                      ) : (
                        <span className="text-[var(--ink-muted)]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-[var(--ink)] max-w-xs">
                      {w.meaning}
                    </td>
                    <td className="py-3 px-4 text-[var(--ink-secondary)] font-mono text-[11px]">
                      {w.pronunciation || "—"}
                    </td>
                    <td className="py-3 px-4 text-[var(--ink-muted)] max-w-xs truncate">
                      {w.synonyms && w.synonyms.length > 0 ? w.synonyms.join(", ") : "—"}
                    </td>
                    <td className="py-3 px-4 text-[var(--ink-secondary)] font-medium">
                      {w.topicName}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(w)}
                          title="Sửa từ vựng"
                          className="p-1.5 text-[var(--navy)] hover:bg-[var(--surface-raised)] rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(w)}
                          title="Xoá từ vựng (Cascade)"
                          className="p-1.5 text-[var(--burgundy)] hover:bg-[var(--wine-light)] rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Server Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[var(--border-light)] flex items-center justify-between text-xs text-[var(--ink-secondary)]">
            <span>
              Trang <strong>{currentPage}</strong> trên <strong>{totalPages}</strong> ({totalWords.toLocaleString("vi-VN")} từ)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage <= 1}
                onClick={() => applyFilters(topicFilter, search, currentPage - 1)}
                className="p-1.5 rounded border border-[var(--border-medium)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--surface-raised)]"
                title="Trang trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => applyFilters(topicFilter, search, currentPage + 1)}
                className="p-1.5 rounded border border-[var(--border-medium)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--surface-raised)]"
                title="Trang tiếp theo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Add/Edit Word */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border-medium)] rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-light)]">
              <h3 className="font-serif font-bold text-lg text-[var(--ink)]">
                {editingWord ? "Chỉnh sửa từ vựng" : "Thêm từ vựng mới"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[var(--ink-muted)] hover:text-[var(--ink)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 bg-[var(--wine-light)] border border-[var(--burgundy)]/30 rounded text-xs text-[var(--burgundy)] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)] mb-1">
                  Chủ đề <span className="text-[var(--burgundy)]">*</span>
                </label>
                <select
                  name="topicId"
                  required
                  defaultValue={editingWord ? editingWord.topicId : topicFilter || ""}
                  className="w-full px-3 py-2 text-xs bg-[var(--surface-raised)] border border-[var(--border-medium)] rounded text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--navy)]"
                >
                  <option value="">-- Chọn chủ đề --</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)] mb-1">
                    Từ tiếng Anh (Word) <span className="text-[var(--burgundy)]">*</span>
                  </label>
                  <input
                    type="text"
                    name="word"
                    required
                    defaultValue={editingWord?.word || ""}
                    placeholder="Ví dụ: scrutinize"
                    className="w-full px-3 py-2 text-xs bg-[var(--surface-raised)] border border-[var(--border-medium)] rounded text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--navy)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)] mb-1">
                    Loại từ (Part of Speech)
                  </label>
                  <input
                    type="text"
                    name="partOfSpeech"
                    defaultValue={editingWord?.partOfSpeech || ""}
                    placeholder="noun, verb, adjective, adverb..."
                    className="w-full px-3 py-2 text-xs bg-[var(--surface-raised)] border border-[var(--border-medium)] rounded text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--navy)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)] mb-1">
                  Nghĩa tiếng Việt <span className="text-[var(--burgundy)]">*</span>
                </label>
                <textarea
                  name="meaning"
                  required
                  rows={2}
                  defaultValue={editingWord?.meaning || ""}
                  placeholder="Nghĩa chi tiết bằng tiếng Việt..."
                  className="w-full px-3 py-2 text-xs bg-[var(--surface-raised)] border border-[var(--border-medium)] rounded text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--navy)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)] mb-1">
                    Phát âm (IPA)
                  </label>
                  <input
                    type="text"
                    name="pronunciation"
                    defaultValue={editingWord?.pronunciation || ""}
                    placeholder="Ví dụ: /ˈskruː.tɪ.naɪz/"
                    className="w-full px-3 py-2 text-xs bg-[var(--surface-raised)] border border-[var(--border-medium)] rounded text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--navy)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)] mb-1">
                    Từ đồng nghĩa (phân tách dấu ;)
                  </label>
                  <input
                    type="text"
                    name="synonyms"
                    defaultValue={editingWord?.synonyms ? editingWord.synonyms.join("; ") : ""}
                    placeholder="examine; inspect; investigate"
                    className="w-full px-3 py-2 text-xs bg-[var(--surface-raised)] border border-[var(--border-medium)] rounded text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--navy)]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border-light)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[var(--ink-secondary)] hover:text-[var(--ink)]"
                >
                  Huỷ bỏ
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-xs font-medium bg-[var(--navy)] text-[#faf7f2] hover:bg-[var(--navy-hover)] rounded shadow-xs disabled:opacity-50"
                >
                  {isPending ? "Đang lưu..." : editingWord ? "Cập nhật" : "Thêm từ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

