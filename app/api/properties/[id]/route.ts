import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const d = await req.json();
  const updated = await prisma.property.update({ where: { id: params.id }, data: {
    addressLine1: d.addressLine1 || "",
    addressLine2: d.addressLine2 || null,
    city: d.city || "",
    province: d.province || null,
    postalCode: d.postalCode || null,
    forType: d.forType || "RENT",
    price: d.price ?? null,
    beds: d.beds ?? null,
    baths: d.baths ?? null,
    ownerName: d.ownerName || null,
    ownerPhone: d.ownerPhone || null,
    ownerEmail: d.ownerEmail || null,
    notes: d.notes || null,
    primaryClientId: d.primaryClientId || null,
  }});
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.property.update({ where: { id: params.id }, data: { archived: true } });
  return NextResponse.json({ ok: true });
}
