import type { Metadata } from "next";
import { Lora, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { getSession } from "@/lib/auth/session";
import { STRINGS } from "@/lib/constants/strings";
import { Suspense } from "react";

const lora = Lora({
  subsets: ["latin", "vietnamese"],
  variable: "--font-serif",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin", "vietnamese"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${STRINGS.app.name} - ${STRINGS.app.tagline}`,
  description: STRINGS.app.description,
};

async function NavServerWrapper() {
  const user = await getSession();
  return <Navbar user={user} />;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${lora.variable} ${sourceSans.variable}`} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--navy)] focus:text-[#faf7f2] focus:rounded-md focus:shadow-md text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--navy)]"
        >
          Chuyển đến nội dung chính
        </a>
        <Suspense fallback={<div className="h-16 border-b border-[var(--border-light)]" />}>
          <NavServerWrapper />
        </Suspense>
        <main id="main-content" className="flex-1">{children}</main>
        <footer className="border-t border-[var(--border-light)] py-6 text-center text-xs text-[var(--ink-muted)]">
          <div className="max-w-7xl mx-auto px-4">
            <p className="font-serif italic">{STRINGS.app.footerText}</p>
            <p className="mt-1">© {new Date().getFullYear()} {STRINGS.app.name}. Tất cả các quyền được bảo lưu.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
