// app/api/public/intake/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/public/intake
 * Public endpoint to create (or update) a client from a generic intake form.
 * - If email matches an existing client, we UPDATE that client (dedupe).
 * - Otherwise we CREATE a new client.
 *
 * Optional query string:
 *   ?agent=<name>   // pre-assigns agentOnJob if provided
 */
function s(v: unknown): string | null {
  const out = (v ?? "").toString().trim();
  return out === "" ? null : out;
}
function n(v: unknown): number | null {
  const str = (v ?? "").toString().trim();
  if (str === "") return null;
  const num = Number(str);
  return Number.isFinite(num) ? num : null;
}
function d(v: unknown): Date | null {
  const str = (v ?? "").toString().trim();
  if (str === "") return null;
  const dt = new Date(str);
  return isNaN(dt.getTime()) ? null : dt;
}
function tagsAsComma(v: unknown): string {
  if (Array.isArray(v)) return v.map(String).map(t => t.trim()).filter(Boolean).join(", ");
  const str = (v ?? "").toString().trim();
  return str;
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const agentPrefill = s(url.searchParams.get("agent"));
  const body = await req.json().catch(() => ({} as any));

  const firstName = s(body.firstName) ?? "";
  const lastName  = s(body.lastName) ?? "";
  const email     = s(body.email);       // may be null
  const phone     = s(body.phone);
  const birthday  = body.birthday !== undefined ? d(body.birthday) : null;
  const budgetMin = body.budgetMin !== undefined ? n(body.budgetMin) : null;
  const budgetMax = body.budgetMax !== undefined ? n(body.budgetMax) : null;
  const lookingFor = s(body.lookingFor);
  const lastRentalStatus = (body.lastRentalStatus as any) ?? "none";
  const lastRentalNotes  = s(body.lastRentalNotes);
  const tags             = tagsAsComma(body.tags); // clients store comma string
  const agentOnJob       = s(body.agentOnJob) ?? agentPrefill ?? null;

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "First and last name are required." }, { status: 400 });
  }

  // If email present and already exists, update that record (dedupe)
  if (email) {
    const existing = await prisma.client.findUnique({ where: { email } });
    if (existing) {
      const updated = await prisma.client.update({
        where: { id: existing.id },
        data: {
          firstName: firstName || existing.firstName,
          lastName: lastName || existing.lastName,
          phone,
          birthday,
          budgetMin,
          budgetMax,
          lookingFor,
          lastRentalStatus,
          lastRentalNotes,
          tags,
          agentOnJob,
          archived: false,
        },
        select: { id: true },
      });
      return NextResponse.json({ ok: true, id: updated.id, updated: true });
    }
  }

  // Otherwise create new client
  try {
    const created = await prisma.client.create({
      data: {
        firstName,
        lastName,
        email, // can be null
        phone,
        birthday,
        budgetMin,
        budgetMax,
        lookingFor,
        lastRentalStatus,
        lastRentalNotes,
        tags,
        agentOnJob,
        archived: false,
      },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, id: created.id, created: true });
  } catch (e: any) {
    // Unique email race or other DB constraint
    if (email) {
      // Try to recover by updating if another request created it first
      const existing = await prisma.client.findUnique({ where: { email } }).catch(() => null);
      if (existing) {
        const updated = await prisma.client.update({
          where: { id: existing.id },
          data: {
            firstName: firstName || existing.firstName,
            lastName: lastName || existing.lastName,
            phone,
            birthday,
            budgetMin,
            budgetMax,
            lookingFor,
            lastRentalStatus,
            lastRentalNotes,
            tags,
            agentOnJob,
            archived: false,
          },
          select: { id: true },
        });
        return NextResponse.json({ ok: true, id: updated.id, updated: true });
      }
    }
    return NextResponse.json({ error: "Unable to save client." }, { status: 500 });
  }
}
