import { db } from "@/db";
import { importJobs, topics, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Download, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminImportHistoryPage() {
  const jobs = await db
    .select({
      id: importJobs.id,
      fileName: importJobs.fileName,
      status: importJobs.status,
      totalRows: importJobs.totalRows,
      addedRows: importJobs.addedRows,
      skippedRows: importJobs.skippedRows,
      errorRows: importJobs.errorRows,
      createdAt: importJobs.createdAt,
      completedAt: importJobs.completedAt,
      topicName: topics.name,
      userName: users.fullName,
      userEmail: users.email,
    })
    .from(importJobs)
    .leftJoin(topics, eq(importJobs.topicId, topics.id))
    .leftJoin(users, eq(importJobs.userId, users.id))
    .orderBy(desc(importJobs.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif font-bold text-[var(--ink)]">
          Lịch sử Nhập Dữ liệu Từ vựng
        </h2>
        <p className="text-xs text-[var(--ink-secondary)] mt-1">
          Theo dõi toàn bộ các đợt tải file lên hệ thống, số dòng thêm mới, số dòng trùng bỏ qua và tải báo cáo lỗi.
        </p>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border-light)] rounded-lg overflow-hidden shadow-xs">
        {jobs.length === 0 ? (
          <div className="p-10 text-center text-xs text-[var(--ink-muted)]">
            Chưa có lịch sử nhập file nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-raised)] text-[var(--ink-secondary)] border-b border-[var(--border-light)]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Tên tập tin</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Chủ đề</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Người nhập</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-right">Tổng dòng</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-right">Đã thêm</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-right">Trùng (Bỏ qua)</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-right">Lỗi</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Thời gian</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-center">Báo cáo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light)]">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-[var(--surface-raised)]/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-[var(--ink)]">
                      {job.fileName}
                    </td>
                    <td className="py-3 px-4 text-[var(--ink-secondary)] font-serif font-bold">
                      {job.topicName || "—"}
                    </td>
                    <td className="py-3 px-4 text-[var(--ink-secondary)]">
                      {job.userName || job.userEmail || "Hệ thống"}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {job.totalRows.toLocaleString("vi-VN")}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-[var(--sage)]">
                      +{job.addedRows.toLocaleString("vi-VN")}
                    </td>
                    <td className="py-3 px-4 text-right text-[var(--ink-muted)]">
                      {job.skippedRows.toLocaleString("vi-VN")}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {job.errorRows > 0 ? (
                        <span className="font-semibold text-[var(--burgundy)]">
                          {job.errorRows}
                        </span>
                      ) : (
                        <span className="text-[var(--ink-muted)]">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[var(--ink-muted)]">
                      {new Date(job.createdAt).toLocaleDateString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {job.errorRows > 0 ? (
                        <a
                          href={`/api/admin/import/jobs/${job.id}/errors-csv`}
                          download
                          title="Tải file CSV dòng lỗi"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded bg-[var(--wine-light)] text-[var(--burgundy)] hover:bg-[var(--burgundy)] hover:text-[#faf7f2] transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          <span>File lỗi</span>
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[var(--sage)] font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Hợp lệ</span>
                        </span>
                      )}
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

