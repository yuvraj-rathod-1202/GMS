import { NextRequest, NextResponse } from "next/server";

const publicRoutes = ["/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("authToken")?.value;

  // If user is on a public route, allow access
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // If user is on a protected route and has no token, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|static|favicon.ico).*)"],
};
