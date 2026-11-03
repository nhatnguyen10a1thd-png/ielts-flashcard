import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "auth_session";
const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || "fallback-secret-key-ielts-flashcard-at-least-32-chars-long"
);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read session cookie
  const token = request.cookies.get(COOKIE_NAME)?.value;
  let user: {
    userId: string;
    email: string;
    role: "admin" | "learner";
    mustChangePassword: boolean;
  } | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET_KEY);
      user = {
        userId: payload.userId as string,
        email: payload.email as string,
        role: payload.role as "admin" | "learner",
        mustChangePassword: Boolean(payload.mustChangePassword),
      };
    } catch {
      user = null;
    }
  }

  // 1. Force first-time password change if required
  if (user?.mustChangePassword && user.role !== "admin") {
    const isAllowedPath =
      pathname.startsWith("/doi-mat-khau-lan-dau") ||
      pathname.startsWith("/api/auth/first-login-change-password") ||
      pathname.startsWith("/api/auth/logout") ||
      pathname.startsWith("/dang-xuat");

    if (!isAllowedPath) {
      const url = request.nextUrl.clone();
      url.pathname = "/doi-mat-khau-lan-dau";
      return NextResponse.redirect(url);
    }
  }

  // 2. Protect Admin routes: /admin and /admin/*
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/dang-nhap";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    if (user.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // 3. Prevent logged in users from visiting auth pages (login, register, forgot-password)
  const isAuthPage =
    pathname === "/dang-nhap" ||
    pathname === "/dang-ky" ||
    pathname === "/quen-mat-khau" ||
    pathname.startsWith("/dat-lai-mat-khau");

  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.search = "";
    url.pathname = user.role === "admin" ? "/admin" : "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/dang-nhap",
    "/dang-ky",
    "/quen-mat-khau",
    "/dat-lai-mat-khau/:path*",
    "/doi-mat-khau-lan-dau",
    "/chu-de/:path*",
    "/kiem-tra/:path*",
    "/lich-su/:path*",
  ],
};

