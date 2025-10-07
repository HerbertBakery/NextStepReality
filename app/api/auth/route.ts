import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(()=>null) as any;
  const email = body?.email;
  const pass = body?.pass;
  if (email === process.env.ADMIN_EMAIL && pass === process.env.ADMIN_PASS) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set("realtor_session", "ok", { httpOnly: true, path: "/", sameSite: "lax" });
    return res;
  }
  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}
