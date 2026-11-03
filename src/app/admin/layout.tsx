import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FolderKanban,
  BookText,
  FileSpreadsheet,
  History,
  ShieldCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== "admin") {
    redirect("/dang-nhap?redirect=/admin");
  }

  if (session.mustChangePassword) {
    redirect("/doi-mat-khau-lan-dau");
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Admin Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[var(--border-light)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-sm bg-[var(--burgundy)] text-[#faf7f2]">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--burgundy)]">
              Khu vực Quản trị viên
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--ink)] mt-1">
            Hệ thống Quản lý Từ vựng
          </h1>
        </div>

        {/* Sub-navigation tabs */}
        <nav className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-[var(--border-medium)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-raised)] transition-colors whitespace-nowrap"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-[var(--navy)]" />
            <span>Tổng quan</span>
          </Link>
          <Link
            href="/admin/chu-de"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-[var(--border-medium)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-raised)] transition-colors whitespace-nowrap"
          >
            <FolderKanban className="w-3.5 h-3.5 text-[var(--navy)]" />
            <span>Chủ đề</span>
          </Link>
          <Link
            href="/admin/tu-vung"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-[var(--border-medium)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-raised)] transition-colors whitespace-nowrap"
          >
            <BookText className="w-3.5 h-3.5 text-[var(--navy)]" />
            <span>Từ vựng</span>
          </Link>
          <Link
            href="/admin/nhap-lieu"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--navy)] text-[#faf7f2] hover:bg-[var(--navy-hover)] transition-colors whitespace-nowrap"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Nhập file</span>
          </Link>
          <Link
            href="/admin/lich-su-nhap"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-[var(--border-medium)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-raised)] transition-colors whitespace-nowrap"
          >
            <History className="w-3.5 h-3.5 text-[var(--ink-secondary)]" />
            <span>Lịch sử nhập</span>
          </Link>
        </nav>
      </div>

      {children}
    </div>
  );
}

