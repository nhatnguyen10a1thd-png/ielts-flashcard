"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { STRINGS } from "@/lib/constants/strings";
import { ThemeToggle } from "./ThemeToggle";
import { SessionUser } from "@/lib/auth/session";
import { logoutAction } from "@/actions/auth";
import { BookOpen, LogOut, Menu, ShieldCheck, User as UserIcon, X } from "lucide-react";

interface NavbarProps {
  user: SessionUser | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-light)] bg-[var(--canvas)]/95 backdrop-blur-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 group font-serif text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink)]"
            >
              <span className="w-8 h-8 rounded-sm bg-[var(--navy)] text-[var(--canvas)] flex items-center justify-center text-base font-serif shadow-xs">
                I
              </span>
              <span>{STRINGS.app.name}</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              href="/chu-de"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/chu-de")
                  ? "bg-[var(--surface-raised)] text-[var(--navy)] font-semibold"
                  : "text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:bg-[var(--surface-raised)]"
              }`}
            >
              {STRINGS.nav.topics}
            </Link>

            {user && (
              <>
                <Link
                  href="/kiem-tra"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/kiem-tra")
                      ? "bg-[var(--surface-raised)] text-[var(--navy)] font-semibold"
                      : "text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:bg-[var(--surface-raised)]"
                  }`}
                >
                  {STRINGS.nav.practice}
                </Link>

                <Link
                  href="/lich-su"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/lich-su")
                      ? "bg-[var(--surface-raised)] text-[var(--navy)] font-semibold"
                      : "text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:bg-[var(--surface-raised)]"
                  }`}
                >
                  {STRINGS.nav.history}
                </Link>
              </>
            )}

            {user?.role === "admin" && (
              <Link
                href="/admin"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${
                  isActive("/admin")
                    ? "border-[var(--burgundy)] bg-[var(--wine-light)] text-[var(--burgundy)] font-semibold"
                    : "border-[var(--border-medium)] text-[var(--burgundy)] hover:bg-[var(--wine-light)]"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{STRINGS.nav.admin}</span>
              </Link>
            )}
          </nav>

          {/* Right Controls */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />

            {user ? (
              <div className="flex items-center gap-3 border-l border-[var(--border-light)] pl-3">
                <span className="text-xs text-[var(--ink-muted)] flex items-center gap-1">
                  <UserIcon className="w-3.5 h-3.5" />
                  <strong className="text-[var(--ink)]">{user.fullName}</strong>
                </span>

                <form action={logoutAction} method="post">
                  <button
                    type="submit"
                    className="flex items-center gap-1 text-xs text-[var(--ink-secondary)] hover:text-[var(--burgundy)] transition-colors py-1.5 px-2 rounded-md hover:bg-[var(--surface-raised)]"
                    title={STRINGS.nav.logout}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{STRINGS.nav.logout}</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/dang-nhap"
                  className="px-3 py-1.5 text-sm font-medium text-[var(--ink-secondary)] hover:text-[var(--ink)] transition-colors"
                >
                  {STRINGS.nav.login}
                </Link>
                <Link
                  href="/dang-ky"
                  className="px-3.5 py-1.5 text-sm font-medium rounded-md bg-[var(--navy)] text-[#faf7f2] hover:bg-[var(--navy-hover)] transition-colors shadow-xs"
                >
                  {STRINGS.nav.register}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-menu"
              className="p-2 rounded-md text-[var(--ink-secondary)] hover:bg-[var(--surface-raised)]"
              aria-label="Mở menu điều hướng"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div id="mobile-navigation-menu" className="md:hidden border-b border-[var(--border-light)] bg-[var(--surface)] px-4 pt-2 pb-4 space-y-2">
          <Link
            href="/chu-de"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-[var(--ink)] hover:bg-[var(--surface-raised)]"
          >
            {STRINGS.nav.topics}
          </Link>

          {user && (
            <>
              <Link
                href="/kiem-tra"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-[var(--ink)] hover:bg-[var(--surface-raised)]"
              >
                {STRINGS.nav.practice}
              </Link>
              <Link
                href="/lich-su"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-[var(--ink)] hover:bg-[var(--surface-raised)]"
              >
                {STRINGS.nav.history}
              </Link>
            </>
          )}

          {user?.role === "admin" && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-[var(--burgundy)] hover:bg-[var(--wine-light)] font-semibold"
            >
              ★ {STRINGS.nav.admin}
            </Link>
          )}

          <div className="pt-3 border-t border-[var(--border-light)]">
            {user ? (
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm text-[var(--ink)] font-medium">
                  {user.fullName} ({user.role === "admin" ? "Quản trị" : "Học viên"})
                </span>
                <form action={logoutAction} method="post">
                  <button
                    type="submit"
                    className="text-sm text-[var(--burgundy)] font-medium hover:underline flex items-center gap-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{STRINGS.nav.logout}</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  href="/dang-nhap"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 px-3 rounded-md border border-[var(--border-medium)] text-sm font-medium text-[var(--ink)]"
                >
                  {STRINGS.nav.login}
                </Link>
                <Link
                  href="/dang-ky"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 px-3 rounded-md bg-[var(--navy)] text-[#faf7f2] text-sm font-medium"
                >
                  {STRINGS.nav.register}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

