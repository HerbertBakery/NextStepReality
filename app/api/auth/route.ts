import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, pass } = await req.json().catch(() => ({}));
  const ok = email === process.env.ADMIN_EMAIL && pass === process.env.ADMIN_PASS;
  if (!ok) return NextResponse.json({ error: "Invalid" }, { status: 401 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("realtor_session", "ok", {
    httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("realtor_session", "", { path: "/", maxAge: 0 });
  return res;
}
