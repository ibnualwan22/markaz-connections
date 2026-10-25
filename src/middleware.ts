import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, COOKIE_NAME } from "./lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;

  // Halaman pecahan admin (dulu /admin): hanya superadmin.
  const halamanAdmin = ["/akun", "/website", "/akses", "/role", "/audit"];
  const butuhLogin =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profil") ||
    halamanAdmin.includes(pathname);

  if (butuhLogin && !payload) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (halamanAdmin.includes(pathname) && payload?.peran !== "superadmin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (pathname === "/login" && payload) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/akun",
    "/website",
    "/akses",
    "/role",
    "/audit",
    "/profil",
    "/profil/:path*",
    "/login",
  ],
};
