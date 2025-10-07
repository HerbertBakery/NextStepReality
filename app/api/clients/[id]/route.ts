import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(_req: Request, { params }: { params: { id: string } }) {
  const data = await _req.json();
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
    }
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.client.update({ where: { id: params.id }, data: { archived: true } });
  return NextResponse.json({ ok: true });
}
