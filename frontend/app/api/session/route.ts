import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { token, lastLogin } = await request.json();
  const res = NextResponse.json({ ok: true });
  // Set cookie accessible to middleware
  res.cookies.set("authToken", String(token), {
    httpOnly: false,
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
    sameSite: "lax",
  });
  // Save last login time as ISO string
  const ts = typeof lastLogin === 'string' ? lastLogin : new Date().toISOString();
  res.cookies.set("lastLogin", ts, {
    httpOnly: false,
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
    sameSite: "lax",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  // Clear cookie
  res.cookies.set("authToken", "", {
    httpOnly: false,
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });
  res.cookies.set("lastLogin", "", {
    httpOnly: false,
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });
  return res;
}