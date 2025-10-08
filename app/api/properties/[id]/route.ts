// app/api/properties/[id]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const one = await prisma.property.findUnique({
    where: { id: params.id },
    select: {
      id: true, addressLine1: true, addressLine2: true, city: true,
      forType: true, price: true, beds: true, baths: true,
      ownerName: true, ownerPhone: true, ownerEmail: true,
      notes: true, archived: true, imageUrl: true,
      primaryClientId: true, createdAt: true, updatedAt: true,
    },
  });
  if (!one) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(one);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const d = await req.json();
  const updated = await prisma.property.update({
    where: { id: params.id },
    data: {
      addressLine1: d.addressLine1 || "",
      addressLine2: d.addressLine2 || null,
      city: d.city || "",
      forType: d.forType || "RENT",
      price: d.price ?? null,
      beds: d.beds ?? null,
      baths: d.baths ?? null,
      ownerName: d.ownerName || null,
      ownerPhone: d.ownerPhone || null,
      ownerEmail: d.ownerEmail || null,
      notes: d.notes || null,
      primaryClientId: d.primaryClientId || null,
      imageUrl: d.imageUrl ?? null,
    },
    select: {
      id: true, addressLine1: true, addressLine2: true, city: true,
      forType: true, price: true, beds: true, baths: true,
      ownerName: true, ownerPhone: true, ownerEmail: true,
      notes: true, archived: true, imageUrl: true,
      primaryClientId: true, createdAt: true, updatedAt: true,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.property.update({ where: { id: params.id }, data: { archived: true } });
  return NextResponse.json({ ok: true });
}
