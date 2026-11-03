"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Upload,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
  ArrowRight,
  RefreshCw,
  Info,
  FolderPlus,
  BookOpen,
} from "lucide-react";
import { TopicOption } from "../tu-vung/WordManager";

interface PreviewData {
  fileName: string;
  suggestedTopicName: string;
  headers: string[];
  mapping: {
    wordKey: string | null;
    partOfSpeechKey: string | null;
    meaningKey: string | null;
    pronunciationKey: string | null;
    synonymsKey: string | null;
  };
  totalRows: number;
  validRowsCount: number;
  errorRowsCount: number;
  previewRows: Array<{
    rowNumber: number;
    word: string;
    partOfSpeech: string | null;
    meaning: string;
    pronunciation: string | null;
    synonyms: string[];
  }>;
  errorRowsPreview: Array<{
    row: number;
    error: string;
    raw: Record<string, string>;
  }>;
}

interface ImportReport {
  jobId: string;
  topicId: string;
  topicName: string;
  fileName: string;
  status: string;
  totalRows: number;
  addedRows: number;
  skippedRows: number;
  errorRows: number;
}

export function ImportWizard({ topics }: { topics: TopicOption[] }) {
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "result">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [topicMode, setTopicMode] = useState<"new" | "existing">("new");
  const [newTopicName, setNewTopicName] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [importReport, setImportReport] = useState<ImportReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Xử lý khi người dùng chọn file
  const handleFileSelected = async (selectedFile: File) => {
    setFile(selectedFile);
    setErrorMsg("");
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/admin/import/preview", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Không thể đọc tập tin.");
      }

      setPreviewData(data);
      setNewTopicName(data.suggestedTopicName || "");
      setStep("preview");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Lỗi khi xử lý file tải lên");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  // Xác nhận nhập dữ liệu
  const handleConfirmImport = async () => {
    if (!file) return;

    if (topicMode === "new" && !newTopicName.trim()) {
      setErrorMsg("Vui lòng nhập tên cho chủ đề mới.");
      return;
    }

    if (topicMode === "existing" && !selectedTopicId) {
      setErrorMsg("Vui lòng chọn một chủ đề có sẵn trong danh sách.");
      return;
    }

    setIsLoading(true);
    setStep("importing");
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      if (topicMode === "existing") {
        formData.append("topicId", selectedTopicId);
      } else {
        formData.append("newTopicName", newTopicName.trim());
      }

      const res = await fetch("/api/admin/import/execute", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Quá trình nhập dữ liệu thất bại.");
      }

      setImportReport(data.report);
      setStep("result");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Đã xảy ra lỗi khi nhập dữ liệu.");
      setStep("preview");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewData(null);
    setImportReport(null);
    setErrorMsg("");
    setStep("upload");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Sample Files Download Bar */}
      <div className="p-4 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-medium)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[var(--navy)] shrink-0" />
          <span className="text-[var(--ink-secondary)]">
            Hệ thống nhận diện tiêu đề tiếng Anh lẫn tiếng Việt, hỗ trợ dấu phân cách <strong>phẩy (,)</strong> hoặc <strong>chấm phẩy (;)</strong>.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/api/admin/sample-file?format=csv&lang=vi"
            download
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-[var(--border-medium)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-hover)] font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[var(--navy)]" />
            <span>File mẫu CSV</span>
          </a>
          <a
            href="/api/admin/sample-file?format=xlsx&lang=vi"
            download
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-[var(--border-medium)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-hover)] font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[var(--sage)]" />
            <span>File mẫu Excel (.xlsx)</span>
          </a>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-[var(--wine-light)] border border-[var(--burgundy)]/30 rounded text-xs text-[var(--burgundy)] flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: UPLOAD */}
      {step === "upload" && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-[var(--border-medium)] rounded-lg p-10 text-center bg-[var(--surface)] hover:bg-[var(--surface-raised)]/30 transition-colors"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            className="hidden"
          />

          <div className="w-14 h-14 rounded-full bg-[var(--surface-raised)] text-[var(--navy)] flex items-center justify-center mx-auto mb-4 shadow-xs">
            <Upload className="w-7 h-7" />
          </div>

          <h3 className="font-serif font-bold text-lg text-[var(--ink)]">
            Kéo thả tập tin từ vựng vào đây
          </h3>
          <p className="mt-1 text-xs text-[var(--ink-secondary)]">
            Hỗ trợ định dạng .csv (UTF-8, tự nhận BOM) và .xlsx. Mỗi file tương ứng một chủ đề.
          </p>

          <div className="mt-6">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[var(--navy)] text-[#faf7f2] hover:bg-[var(--navy-hover)] text-xs font-semibold transition-colors shadow-xs disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isLoading ? "Đang đọc tập tin..." : "Chọn tập tin từ máy tính"}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: PREVIEW & CONFIGURATION */}
      {step === "preview" && previewData && (
        <div className="space-y-6">
          {/* Topic Assignment Box */}
          <div className="p-5 rounded-lg bg-[var(--surface)] border border-[var(--border-light)] shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-sm text-[var(--ink)] flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-[var(--navy)]" />
              <span>Gán chủ đề cho tập tin: &quot;{previewData.fileName}&quot;</span>
            </h3>

            <div className="flex flex-col sm:flex-row gap-4">
              <label className="flex items-center gap-2 text-xs font-medium text-[var(--ink)] cursor-pointer">
                <input
                  type="radio"
                  name="topicOption"
                  checked={topicMode === "new"}
                  onChange={() => setTopicMode("new")}
                  className="text-[var(--navy)] focus:ring-[var(--navy)]"
                />
                <span>Tạo chủ đề mới (mặc định lấy theo tên file)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-[var(--ink)] cursor-pointer">
                <input
                  type="radio"
                  name="topicOption"
                  checked={topicMode === "existing"}
                  onChange={() => setTopicMode("existing")}
                  className="text-[var(--navy)] focus:ring-[var(--navy)]"
                />
                <span>Gán vào chủ đề đã có sẵn ({topics.length} chủ đề)</span>
              </label>
            </div>

            {topicMode === "new" ? (
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-secondary)] mb-1">
                  Tên chủ đề mới
                </label>
                <input
                  type="text"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  placeholder="Nhập tên chủ đề..."
                  className="w-full sm:max-w-md px-3 py-2 text-xs bg-[var(--surface-raised)] border border-[var(--border-medium)] rounded text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--navy)]"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-secondary)] mb-1">
                  Chọn chủ đề có sẵn
                </label>
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="w-full sm:max-w-md px-3 py-2 text-xs bg-[var(--surface-raised)] border border-[var(--border-medium)] rounded text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--navy)]"
                >
                  <option value="">-- Chọn chủ đề từ danh mục --</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Column Detection Status */}
          <div className="p-4 rounded-lg bg-[var(--surface)] border border-[var(--border-light)] shadow-xs space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)]">
              Nhận diện cột dữ liệu
            </h4>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className={`px-2.5 py-1 rounded font-medium ${previewData.mapping.wordKey ? "bg-[var(--sage-light)] text-[var(--sage)]" : "bg-[var(--wine-light)] text-[var(--burgundy)]"}`}>
                Từ vựng: {previewData.mapping.wordKey || "Chưa nhận diện được"}
              </span>
              <span className={`px-2.5 py-1 rounded font-medium ${previewData.mapping.meaningKey ? "bg-[var(--sage-light)] text-[var(--sage)]" : "bg-[var(--wine-light)] text-[var(--burgundy)]"}`}>
                Nghĩa: {previewData.mapping.meaningKey || "Chưa nhận diện được"}
              </span>
              <span className="px-2.5 py-1 rounded font-medium bg-[var(--surface-raised)] text-[var(--ink-secondary)]">
                Loại từ: {previewData.mapping.partOfSpeechKey || "Không có (tuỳ chọn)"}
              </span>
              <span className="px-2.5 py-1 rounded font-medium bg-[var(--surface-raised)] text-[var(--ink-secondary)]">
                Phát âm: {previewData.mapping.pronunciationKey || "Không có (tuỳ chọn)"}
              </span>
              <span className="px-2.5 py-1 rounded font-medium bg-[var(--surface-raised)] text-[var(--ink-secondary)]">
                Từ đồng nghĩa: {previewData.mapping.synonymsKey || "Không có (tuỳ chọn)"}
              </span>
            </div>
          </div>

          {/* Error warnings if any */}
          {previewData.errorRowsCount > 0 && (
            <div className="p-3 bg-[var(--wine-light)] border border-[var(--burgundy)]/30 rounded text-xs text-[var(--burgundy)] space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Phát hiện {previewData.errorRowsCount} dòng không hợp lệ (thiếu từ hoặc thiếu nghĩa).</span>
              </p>
              <p className="text-[11px] text-[var(--burgundy)]/90">
                Các dòng lỗi này sẽ được tự động bỏ qua khi nhập và bạn có thể tải danh sách lỗi sau khi hoàn thành.
              </p>
            </div>
          )}

          {/* Preview Table (20 first rows) */}
          <div className="bg-[var(--surface)] border border-[var(--border-light)] rounded-lg overflow-hidden shadow-xs">
            <div className="p-3 bg-[var(--surface-raised)] border-b border-[var(--border-light)] flex items-center justify-between">
              <span className="font-serif font-bold text-xs text-[var(--ink)]">
                Xem trước 20 dòng đầu ({previewData.validRowsCount} dòng hợp lệ / tổng {previewData.totalRows} dòng)
              </span>
              <span className="text-[11px] text-[var(--ink-muted)]">
                Từ trùng sẽ tự động bỏ qua theo từ và loại từ
              </span>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--surface-raised)] text-[var(--ink-secondary)] border-b border-[var(--border-light)] sticky top-0">
                  <tr>
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Từ vựng (Word)</th>
                    <th className="py-2 px-3">Loại từ</th>
                    <th className="py-2 px-3">Nghĩa tiếng Việt</th>
                    <th className="py-2 px-3">Phát âm</th>
                    <th className="py-2 px-3">Từ đồng nghĩa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-light)]">
                  {previewData.previewRows.map((row) => (
                    <tr key={row.rowNumber} className="hover:bg-[var(--surface-raised)]/30">
                      <td className="py-2 px-3 text-[var(--ink-muted)] text-[11px]">{row.rowNumber}</td>
                      <td className="py-2 px-3 font-serif font-bold text-[var(--ink)]">{row.word}</td>
                      <td className="py-2 px-3 italic text-[var(--ink-secondary)]">{row.partOfSpeech || "—"}</td>
                      <td className="py-2 px-3 font-medium text-[var(--ink)]">{row.meaning}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-[var(--ink-secondary)]">{row.pronunciation || "—"}</td>
                      <td className="py-2 px-3 text-[var(--ink-muted)]">{row.synonyms.join(", ") || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Confirmation Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-xs font-medium text-[var(--ink-secondary)] hover:text-[var(--ink)] border border-[var(--border-medium)] rounded bg-[var(--surface)] hover:bg-[var(--surface-raised)]"
            >
              Chọn lại tập tin khác
            </button>

            <button
              type="button"
              onClick={handleConfirmImport}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-[#faf7f2] bg-[var(--navy)] hover:bg-[var(--navy-hover)] rounded shadow-xs"
            >
              <span>Xác nhận & Bắt đầu nhập {previewData.validRowsCount} từ</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: IMPORTING PROGRESS */}
      {step === "importing" && (
        <div className="p-12 bg-[var(--surface)] border border-[var(--border-light)] rounded-lg text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full border-3 border-[var(--navy)] border-t-transparent animate-spin mx-auto" />
          <h3 className="font-serif font-bold text-lg text-[var(--ink)]">
            Đang xử lý dữ liệu từ vựng theo lô...
          </h3>
          <p className="text-xs text-[var(--ink-secondary)] max-w-md mx-auto">
            Hệ thống đang chuẩn hoá dữ liệu, thực hiện đối chiếu loại trùng từ tự động và lưu vào cơ sở dữ liệu.
          </p>
        </div>
      )}

      {/* STEP 4: RESULT REPORT */}
      {step === "result" && importReport && (
        <div className="bg-[var(--surface)] border border-[var(--border-light)] rounded-lg p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-[var(--sage-light)] text-[var(--sage)]">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-xl text-[var(--ink)]">
                Nhập dữ liệu hoàn tất!
              </h3>
              <p className="text-xs text-[var(--ink-secondary)]">
                Chủ đề: <strong>{importReport.topicName}</strong> | Tập tin: <strong>{importReport.fileName}</strong>
              </p>
            </div>
          </div>

          {/* 4 Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-md bg-[var(--surface-raised)] border border-[var(--border-light)] text-center">
              <span className="block text-2xl font-serif font-bold text-[var(--ink)]">
                {importReport.totalRows.toLocaleString("vi-VN")}
              </span>
              <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-secondary)]">
                Tổng số dòng
              </span>
            </div>

            <div className="p-4 rounded-md bg-[var(--sage-light)] border border-[var(--sage)]/30 text-center">
              <span className="block text-2xl font-serif font-bold text-[var(--sage)]">
                +{importReport.addedRows.toLocaleString("vi-VN")}
              </span>
              <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wider text-[var(--sage)]">
                Đã thêm mới
              </span>
            </div>

            <div className="p-4 rounded-md bg-[var(--surface-raised)] border border-[var(--border-light)] text-center">
              <span className="block text-2xl font-serif font-bold text-[var(--ink-muted)]">
                {importReport.skippedRows.toLocaleString("vi-VN")}
              </span>
              <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                Trùng (Bỏ qua)
              </span>
            </div>

            <div className="p-4 rounded-md bg-[var(--wine-light)] border border-[var(--burgundy)]/30 text-center">
              <span className="block text-2xl font-serif font-bold text-[var(--burgundy)]">
                {importReport.errorRows.toLocaleString("vi-VN")}
              </span>
              <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wider text-[var(--burgundy)]">
                Dòng lỗi
              </span>
            </div>
          </div>

          {/* Download Error CSV Button if there were errors */}
          {importReport.errorRows > 0 && (
            <div className="p-4 rounded-md bg-[var(--wine-light)] border border-[var(--burgundy)]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-[var(--burgundy)] font-medium">
                Có {importReport.errorRows} dòng bị lỗi trong tập tin (thiếu thông tin bắt buộc). Bạn có thể tải danh sách chi tiết để chỉnh sửa lại.
              </div>
              <a
                href={`/api/admin/import/jobs/${importReport.jobId}/errors-csv`}
                download
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded bg-[var(--burgundy)] text-[#faf7f2] hover:bg-[var(--burgundy-hover)] transition-colors whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải file CSV dòng lỗi</span>
              </a>
            </div>
          )}

          {/* Navigation links */}
          <div className="pt-4 border-t border-[var(--border-light)] flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium border border-[var(--border-medium)] rounded bg-[var(--surface)] hover:bg-[var(--surface-raised)] text-[var(--ink)]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tiếp tục nhập tập tin khác</span>
            </button>

            <div className="flex items-center gap-2">
              <Link
                href="/admin/tu-vung"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded bg-[var(--navy)] text-[#faf7f2] hover:bg-[var(--navy-hover)] shadow-xs"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Xem danh sách từ vựng</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

