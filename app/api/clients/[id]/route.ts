// app/api/clients/[id]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const one = await prisma.client.findUnique({ where: { id: params.id } });
  if (!one || one.archived) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(one);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const data = await req.json();
  const updated = await prisma.client.update({
    where: { id: params.id },
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
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.client.update({ where: { id: params.id }, data: { archived: true } });
  return NextResponse.json({ ok: true });
}
