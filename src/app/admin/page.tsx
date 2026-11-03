import { db } from "@/db";
import { topics, words, users, importJobs } from "@/db/schema";
import { sql, isNull, desc, eq } from "drizzle-orm";
import Link from "next/link";
import {
  FolderKanban,
  BookText,
  Users,
  FileSpreadsheet,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export default async function AdminDashboardPage() {
  // Statistics
  const [activeTopics] = await db
    .select({ count: sql<number>`count(*)` })
    .from(topics)
    .where(isNull(topics.deletedAt));

  const [totalWords] = await db
    .select({ count: sql<number>`count(*)` })
    .from(words);

  const [totalLearners] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.role, "learner"));

  // Recent import jobs
  const recentImports = await db
    .select({
      id: importJobs.id,
      fileName: importJobs.fileName,
      status: importJobs.status,
      totalRows: importJobs.totalRows,
      addedRows: importJobs.addedRows,
      skippedRows: importJobs.skippedRows,
      errorRows: importJobs.errorRows,
      createdAt: importJobs.createdAt,
      topicName: topics.name,
    })
    .from(importJobs)
    .leftJoin(topics, eq(importJobs.topicId, topics.id))
    .orderBy(desc(importJobs.createdAt))
    .limit(5);

  return (
    <div className="space-y-8">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-lg bg-[var(--surface)] border border-[var(--border-light)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)]">
              Chủ đề đang hoạt động
            </span>
            <div className="p-2 rounded-md bg-[var(--surface-raised)] text-[var(--navy)]">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-serif font-bold text-[var(--navy)]">
            {Number(activeTopics?.count || 0).toLocaleString("vi-VN")}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-[var(--ink-muted)]">
            <span>Quản lý danh mục từ</span>
            <Link
              href="/admin/chu-de"
              className="text-[var(--navy)] hover:underline font-medium inline-flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-[var(--surface)] border border-[var(--border-light)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)]">
              Tổng số từ vựng
            </span>
            <div className="p-2 rounded-md bg-[var(--surface-raised)] text-[var(--burgundy)]">
              <BookText className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-serif font-bold text-[var(--burgundy)]">
            {Number(totalWords?.count || 0).toLocaleString("vi-VN")}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-[var(--ink-muted)]">
            <span>Toàn bộ cơ sở dữ liệu</span>
            <Link
              href="/admin/tu-vung"
              className="text-[var(--burgundy)] hover:underline font-medium inline-flex items-center gap-1"
            >
              <span>Tra cứu</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-[var(--surface)] border border-[var(--border-light)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)]">
              Tổng số học viên
            </span>
            <div className="p-2 rounded-md bg-[var(--surface-raised)] text-[var(--sage)]">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-serif font-bold text-[var(--sage)]">
            {Number(totalLearners?.count || 0).toLocaleString("vi-VN")}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-[var(--ink-muted)]">
            <span>Tài khoản tự đăng ký</span>
            <span className="text-[var(--sage)] font-medium">Hoạt động</span>
          </div>
        </div>
      </div>

      {/* Quick Action Banner */}
      <div className="p-6 rounded-lg bg-gradient-to-r from-[var(--surface-raised)] to-[var(--surface)] border border-[var(--border-light)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-serif font-bold text-[var(--ink)]">
            Nhập danh sách từ vựng quy mô lớn
          </h2>
          <p className="mt-1 text-xs text-[var(--ink-secondary)] max-w-xl">
            Tải lên tệp CSV hoặc Excel (hỗ trợ hàng chục nghìn dòng mỗi lần). Hệ thống tự động nhận diện tiêu đề tiếng Anh/tiếng Việt và tự động loại trùng.
          </p>
        </div>
        <Link
          href="/admin/nhap-lieu"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[var(--navy)] text-[#faf7f2] hover:bg-[var(--navy-hover)] text-xs font-medium transition-colors whitespace-nowrap shadow-xs"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Bắt đầu nhập file</span>
        </Link>
      </div>

      {/* Recent Imports */}
      <div className="bg-[var(--surface)] border border-[var(--border-light)] rounded-lg overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-[var(--border-light)] flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-base text-[var(--ink)]">
              Lần nhập dữ liệu gần đây
            </h3>
            <p className="text-xs text-[var(--ink-secondary)]">
              Lịch sử các tệp dữ liệu đã tải lên hệ thống
            </p>
          </div>
          <Link
            href="/admin/lich-su-nhap"
            className="text-xs text-[var(--navy)] hover:underline font-medium"
          >
            Xem lịch sử đầy đủ
          </Link>
        </div>

        {recentImports.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--ink-muted)]">
            Chưa có lần nhập dữ liệu nào. Nhấn vào &quot;Bắt đầu nhập file&quot; để tải lên bộ từ vựng đầu tiên.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-raised)] text-[var(--ink-secondary)] border-b border-[var(--border-light)]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Tập tin</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Chủ đề</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-right">Tổng dòng</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-right">Thêm mới</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-right">Trùng (Bỏ qua)</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-right">Lỗi</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light)]">
                {recentImports.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--surface-raised)]/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-[var(--ink)]">
                      {item.fileName}
                    </td>
                    <td className="py-3 px-4 text-[var(--ink-secondary)]">
                      {item.topicName || "Chưa gán"}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {item.totalRows.toLocaleString("vi-VN")}
                    </td>
                    <td className="py-3 px-4 text-right text-[var(--sage)] font-semibold">
                      +{item.addedRows.toLocaleString("vi-VN")}
                    </td>
                    <td className="py-3 px-4 text-right text-[var(--ink-muted)]">
                      {item.skippedRows.toLocaleString("vi-VN")}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {item.errorRows > 0 ? (
                        <span className="text-[var(--burgundy)] font-semibold">
                          {item.errorRows}
                        </span>
                      ) : (
                        <span className="text-[var(--ink-muted)]">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[var(--ink-muted)]">
                      {new Date(item.createdAt).toLocaleDateString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

