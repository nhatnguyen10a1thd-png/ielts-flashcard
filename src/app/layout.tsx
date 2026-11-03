import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { getSession } from "@/lib/auth/session";
import { STRINGS } from "@/lib/constants/strings";
import { Suspense } from "react";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7f2" },
    { media: "(prefers-color-scheme: dark)", color: "#18191d" },
  ],
};

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://ielts-flashcard.vn").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: `${STRINGS.app.name} - ${STRINGS.app.tagline}`,
    template: `%s | ${STRINGS.app.name}`,
  },
  description: STRINGS.app.description,
  alternates: {
    canonical: "./",
  },
  openGraph: {
    title: `${STRINGS.app.name} - ${STRINGS.app.tagline}`,
    description: STRINGS.app.description,
    url: baseUrl,
    siteName: STRINGS.app.name,
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: `${STRINGS.app.name} - ${STRINGS.app.tagline}`,
    description: STRINGS.app.description,
  },
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
    <html lang="vi" suppressHydrationWarning>
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
