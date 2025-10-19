// app/api/public/intake/[token]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toNullOrTrim(v: unknown): string | null {
  const s = (v ?? "").toString().trim();
  return s === "" ? null : s;
}
function toNullOrNumber(v: unknown): number | null {
  const s = (v ?? "").toString().trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
function toNullOrDate(v: unknown): Date | null {
  const s = (v ?? "").toString().trim();
  if (s === "") return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const token = params.token;

  const client = await prisma.client.findFirst({
    where: { intakeToken: token, archived: false },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      birthday: true,
      budgetMin: true,
      budgetMax: true,
      lookingFor: true,
      lastRentalStatus: true,
      lastRentalNotes: true,
      tags: true,
      agentOnJob: true,
      updatedAt: true,
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(client, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request, { params }: { params: { token: string } }) {
  const token = params.token;

  const existing = await prisma.client.findFirst({
    where: { intakeToken: token, archived: false },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({} as any));

  // Normalize payload
  const nextEmail = toNullOrTrim(body.email);

  // Enforce email uniqueness if user typed a new email
  if (nextEmail && nextEmail !== (existing.email ?? null)) {
    const clash = await prisma.client.findUnique({ where: { email: nextEmail } });
    if (clash && clash.id !== existing.id) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
  }

  const data = {
    firstName: toNullOrTrim(body.firstName) ?? existing.firstName,
    lastName: toNullOrTrim(body.lastName) ?? existing.lastName,
    email: nextEmail, // can be null
    phone: toNullOrTrim(body.phone),
    birthday: body.birthday !== undefined ? toNullOrDate(body.birthday) : existing.birthday,
    budgetMin: body.budgetMin !== undefined ? toNullOrNumber(body.budgetMin) : existing.budgetMin,
    budgetMax: body.budgetMax !== undefined ? toNullOrNumber(body.budgetMax) : existing.budgetMax,
    lookingFor: body.lookingFor !== undefined ? toNullOrTrim(body.lookingFor) : existing.lookingFor,
    lastRentalStatus: body.lastRentalStatus ?? existing.lastRentalStatus,
    lastRentalNotes: body.lastRentalNotes !== undefined ? toNullOrTrim(body.lastRentalNotes) : existing.lastRentalNotes,
    tags: body.tags !== undefined ? (toNullOrTrim(body.tags) ?? "") : existing.tags, // we store comma string for clients
    agentOnJob: body.agentOnJob !== undefined ? toNullOrTrim(body.agentOnJob) : existing.agentOnJob,
  };

  const updated = await prisma.client.update({
    where: { id: existing.id },
    data,
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: updated.id });
}
