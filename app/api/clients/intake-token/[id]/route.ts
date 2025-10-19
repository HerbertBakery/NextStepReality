// app/api/clients/intake-token/[id]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * POST /api/clients/intake-token/:id
 * - Generates and stores a unique intakeToken for the client
 * - Returns a public URL you can share with the client
 *
 * ENV:
 * - NEXT_PUBLIC_BASE_URL (optional but recommended) e.g. https://your-app.vercel.app
 *   If missing, we return a relative URL /intake/:token
 */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const clientId = params.id;

  // Ensure the client exists and isn't archived
  const client = await prisma.client.findFirst({
    where: { id: clientId, archived: false },
    select: { id: true },
  });
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Create a fresh token (idempotency not required; regenerating is fine)
  const token = crypto.randomBytes(16).toString("hex");

  await prisma.client.update({
    where: { id: clientId },
    data: { intakeToken: token },
  });

  const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") || "";
  const url = base ? `${base}/intake/${token}` : `/intake/${token}`;

  return NextResponse.json({ ok: true, token, url });
}
