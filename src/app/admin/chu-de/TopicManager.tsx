"use client";

import { useState } from "react";
import {
  createTopicAction,
  updateTopicAction,
  toggleTopicVisibilityAction,
  deleteTopicAction,
  restoreTopicAction,
} from "@/actions/admin-topics";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

export interface TopicItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isVisible: boolean;
  deletedAt: string | null;
  createdAt: string;
  wordCount: number;
}

interface TopicManagerProps {
  initialTopics: TopicItem[];
}

export function TopicManager({ initialTopics }: TopicManagerProps) {
  const [activeTab, setActiveTab] = useState<"active" | "trash">("active");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<TopicItem | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isPending, setIsPending] = useState(false);

  // Lọc theo tab và tìm kiếm
  const filteredTopics = initialTopics.filter((t) => {
    const isTrash = Boolean(t.deletedAt);
    if (activeTab === "active" && isTrash) return false;
    if (activeTab === "trash" && !isTrash) return false;

    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(query) ||
      (t.description && t.description.toLowerCase().includes(query))
    );
  });

  const handleOpenCreate = () => {
    setEditingTopic(null);
    setErrorMsg("");
    setSuccessMsg("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (topic: TopicItem) => {
    setEditingTopic(topic);
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
    if (editingTopic) {
      formData.set("id", editingTopic.id);
      res = await updateTopicAction(null, formData);
    } else {
      res = await createTopicAction(null, formData);
    }

    setIsPending(false);

    if (res.success) {
      setSuccessMsg(editingTopic ? "Cập nhật chủ đề thành công!" : "Tạo chủ đề mới thành công!");
      setIsModalOpen(false);
      window.location.reload();
    } else {
      setErrorMsg(res.error || "Đã xảy ra lỗi.");
    }
  };

  const handleToggleVisibility = async (topic: TopicItem) => {
    const res = await toggleTopicVisibilityAction(topic.id, !topic.isVisible);
    if (res.success) {
      window.location.reload();
    }
  };

  const handleDelete = async (topic: TopicItem) => {
    if (!confirm(`Bạn có chắc chắn muốn chuyển chủ đề "${topic.name}" vào thùng rác? Bạn có thể khôi phục trong vòng 30 ngày.`)) {
      return;
    }
    const res = await deleteTopicAction(topic.id);
    if (res.success) {
      window.location.reload();
    }
  };

  const handleRestore = async (topic: TopicItem) => {
    const res = await restoreTopicAction(topic.id);
    if (res.success) {
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Tabs & Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tab switcher */}
        <div className="inline-flex p-1 rounded-md bg-[var(--surface-raised)] border border-[var(--border-medium)]">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition-colors ${
              activeTab === "active"
                ? "bg-[var(--surface)] text-[var(--navy)] shadow-xs"
                : "text-[var(--ink-secondary)] hover:text-[var(--ink)]"
            }`}
          >
            Đang hoạt động ({initialTopics.filter((t) => !t.deletedAt).length})
          </button>
          <button
            onClick={() => setActiveTab("trash")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition-colors ${
              activeTab === "trash"
                ? "bg-[var(--surface)] text-[var(--burgundy)] shadow-xs"
                : "text-[var(--ink-secondary)] hover:text-[var(--ink)]"
            }`}
          >
            Thùng rác ({initialTopics.filter((t) => Boolean(t.deletedAt)).length})
          </button>
        </div>

        {/* Action button */}
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[var(--navy)] text-[#faf7f2] hover:bg-[var(--navy-hover)] text-xs font-medium transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo chủ đề mới</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--ink-muted)]">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm chủ đề theo tên hoặc mô tả..."
          className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--surface)] border border-[var(--border-medium)] rounded-md text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--navy)]"
        />
      </div>

      {/* Notification */}
      {successMsg && (
        <div className="p-3 bg-[var(--sage-light)] border border-[var(--sage)]/30 rounded-md flex items-center gap-2 text-xs text-[var(--sage)] font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-[var(--surface)] border border-[var(--border-light)] rounded-lg overflow-hidden shadow-xs">
        {filteredTopics.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--ink-muted)]">
            {activeTab === "active"
              ? "Chưa có chủ đề nào phù hợp."
              : "Thùng rác hiện đang trống."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-raised)] text-[var(--ink-secondary)] border-b border-[var(--border-light)]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Tên chủ đề</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Mô tả</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-right">Số từ vựng</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-center">Trạng thái</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light)]">
                {filteredTopics.map((topic) => (
                  <tr key={topic.id} className="hover:bg-[var(--surface-raised)]/40 transition-colors">
                    <td className="py-3 px-4 font-serif font-bold text-[var(--ink)] text-sm">
                      {topic.name}
                    </td>
                    <td className="py-3 px-4 text-[var(--ink-secondary)] max-w-xs truncate">
                      {topic.description || "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-[var(--ink)]">
                      {topic.wordCount.toLocaleString("vi-VN")} từ
                    </td>
                    <td className="py-3 px-4 text-center">
                      {topic.deletedAt ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--wine-light)] text-[var(--burgundy)]">
                          Đã xoá (30 ngày)
                        </span>
                      ) : topic.isVisible ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--sage-light)] text-[var(--sage)]">
                          Hiển thị
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--surface-raised)] text-[var(--ink-muted)]">
                          Đang ẩn
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {topic.deletedAt ? (
                          <button
                            onClick={() => handleRestore(topic)}
                            title="Khôi phục chủ đề"
                            className="p-1.5 text-[var(--sage)] hover:bg-[var(--sage-light)] rounded transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleToggleVisibility(topic)}
                              title={topic.isVisible ? "Ẩn chủ đề" : "Hiện chủ đề"}
                              className="p-1.5 text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:bg-[var(--surface-raised)] rounded transition-colors"
                            >
                              {topic.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleOpenEdit(topic)}
                              title="Chỉnh sửa chủ đề"
                              className="p-1.5 text-[var(--navy)] hover:bg-[var(--surface-raised)] rounded transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(topic)}
                              title="Xoá chủ đề (Chuyển vào thùng rác)"
                              className="p-1.5 text-[var(--burgundy)] hover:bg-[var(--wine-light)] rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border-medium)] rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-light)]">
              <h3 className="font-serif font-bold text-lg text-[var(--ink)]">
                {editingTopic ? "Chỉnh sửa chủ đề" : "Tạo chủ đề mới"}
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
                  Tên chủ đề <span className="text-[var(--burgundy)]">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingTopic?.name || ""}
                  placeholder="Ví dụ: IELTS Academic Vocabulary Task 1"
                  className="w-full px-3 py-2 text-xs bg-[var(--surface-raised)] border border-[var(--border-medium)] rounded text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--navy)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)] mb-1">
                  Mô tả ngắn
                </label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingTopic?.description || ""}
                  placeholder="Mô tả mục tiêu và nội dung của chủ đề này..."
                  className="w-full px-3 py-2 text-xs bg-[var(--surface-raised)] border border-[var(--border-medium)] rounded text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--navy)]"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isVisible"
                  name="isVisible"
                  value="true"
                  defaultChecked={editingTopic ? editingTopic.isVisible : true}
                  className="rounded border-[var(--border-medium)] text-[var(--navy)] focus:ring-[var(--navy)]"
                />
                <label htmlFor="isVisible" className="text-xs text-[var(--ink)] font-medium">
                  Hiển thị chủ đề cho học viên thấy ngay sau khi lưu
                </label>
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
                  {isPending ? "Đang lưu..." : editingTopic ? "Cập nhật" : "Tạo chủ đề"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

