// app/api/properties/[id]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const baseSelect = {
  id: true,
  addressLine1: true,
  addressLine2: true,
  city: true,
  forType: true,
  price: true,
  beds: true,
  baths: true,
  ownerName: true,
  ownerPhone: true,
  ownerEmail: true,
  notes: true,
  archived: true,
  imageUrl: true,
  primaryClientId: true,
  createdAt: true,
  updatedAt: true,
  tags: true, // NEW
} as const;

// Normalize tags like Contacts: accept string/array, split on commas OR spaces,
// trim, and lowercase for reliable matching.
function normalizeTags(input: unknown): string[] | undefined {
  const toArray = (s: string) =>
    s
      .split(/[,\s]+/)                 // commas OR whitespace
      .map(v => v.trim())
      .filter(Boolean)
      .map(v => v.toLowerCase());

  if (Array.isArray(input)) {
    return input
      .filter(Boolean)
      .map(String)
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);
  }
  if (typeof input === "string") {
    return toArray(input);
  }
  return undefined;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const one = await prisma.property.findUnique({
    where: { id: params.id },
    select: baseSelect,
  });
  if (!one || one.archived) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(one);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const d = await req.json();
  const tags = normalizeTags(d.tags);

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
      tags: tags ?? undefined, // undefined => keep existing tags
    },
    select: baseSelect,
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.property.update({
    where: { id: params.id },
    data: { archived: true },
  });
  return NextResponse.json({ ok: true });
}
