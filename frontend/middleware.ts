import { NextRequest, NextResponse } from "next/server";

const publicRoutes = ["/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("authToken")?.value;
  const lastLogin = request.cookies.get("lastLogin")?.value;

  // Always allow API routes (e.g., session cookie management)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // If user is on a public route, allow access
  if (publicRoutes.includes(pathname) || pathname.startsWith('/login')) {
    return NextResponse.next();
  }

  // If user is on a protected route and has no token OR expired
  if (!token) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    // Clear any stale cookies
    res.cookies.set("authToken", "", { path: "/", maxAge: 0 });
    res.cookies.set("lastLogin", "", { path: "/", maxAge: 0 });
    return res;
  }

  // Expiry check: lastLogin older than 24 hours
  if (lastLogin) {
    const msInDay = 24 * 60 * 60 * 1000;
    const last = Date.parse(lastLogin);
    if (Number.isFinite(last)) {
      const expired = Date.now() - last > msInDay;
      if (expired) {
        const res = NextResponse.redirect(new URL("/login", request.url));
        res.cookies.set("authToken", "", { path: "/", maxAge: 0 });
        res.cookies.set("lastLogin", "", { path: "/", maxAge: 0 });
        return res;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|static|favicon.ico).*)"],
};
