// app/api/clients/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseDateToken(q: string) {
  // Accept YYYY-MM-DD to match birthday on that day
  const m = q.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const [_, y, mo, d] = m;
  const start = new Date(`${y}-${mo}-${d}T00:00:00.000Z`);
  const end = new Date(`${y}-${mo}-${d}T23:59:59.999Z`);
  return { start, end };
}

function normalizeRentalStatusToken(q: string) {
  const t = q.toLowerCase();
  if (["none", "no", "nil"].includes(t)) return "none";
  if (t.startsWith("appl")) return "applied";
  if (t.startsWith("approv")) return "approved";
  if (t.startsWith("declin") || t === "rejected" || t === "denied") return "declined";
  if (t.includes("moved") && t.includes("in")) return "moved_in";
  if (t.includes("moved") && t.includes("out")) return "moved_out";
  return null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (!q) {
    const items = await prisma.client.findMany({
      where: { archived: false },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ items });
  }

  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);

  // Build Prisma OR filters per token and AND them together
  const andClauses = await Promise.all(tokens.map(async (tok) => {
    const ors: any[] = [
      { firstName: { contains: tok, mode: "insensitive" } },
      { lastName: { contains: tok, mode: "insensitive" } },
      { email: { contains: tok, mode: "insensitive" } },
      { phone: { contains: tok, mode: "insensitive" } },
      { tags: { contains: tok, mode: "insensitive" } },
      { lookingFor: { contains: tok, mode: "insensitive" } },
      { lastRentalNotes: { contains: tok, mode: "insensitive" } },

      // NEW: allow searching by Agent on Job
      { agentOnJob: { contains: tok, mode: "insensitive" } },
    ];

    // rental status token -> exact
    const rs = normalizeRentalStatusToken(tok);
    if (rs) {
      ors.push({ lastRentalStatus: rs as any });
    }

    // numeric token -> budgets
    const num = Number(tok.replace(/[^\d]/g, ""));
    if (!Number.isNaN(num)) {
      ors.push({ budgetMin: num });
      ors.push({ budgetMax: num });
    }

    // date token -> birthday on that day
    const dt = parseDateToken(tok);
    if (dt) {
      ors.push({ birthday: { gte: dt.start, lte: dt.end } });
    }

    return { OR: ors };
  }));

  const items = await prisma.client.findMany({
    where: { archived: false, AND: andClauses },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const data = await req.json();

  const created = await prisma.client.create({
    data: {
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      email: data.email || null,
      phone: data.phone || null,
      birthday: data.birthday ? new Date(data.birthday) : null,
      budgetMin: data.budgetMin ?? null,
      budgetMax: data.budgetMax ?? null,
      lookingFor: data.lookingFor || null,
      lastRentalStatus: data.lastRentalStatus || "none",
      lastRentalNotes: data.lastRentalNotes || null,
      tags: data.tags || null,

      // NEW: persist Agent on Job
      agentOnJob: data.agentOnJob || null,
    },
  });

  return NextResponse.json(created);
}
