// app/api/properties/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// Normalize tags like Contacts: accept string/array, split on commas OR spaces,
// trim blanks, lowercase for reliable case-sensitive array matching.
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

const baseSelect = {
  id: true, addressLine1: true, addressLine2: true, city: true,
  forType: true, price: true, beds: true, baths: true,
  ownerName: true, ownerPhone: true, ownerEmail: true,
  notes: true, archived: true, imageUrl: true,
  primaryClientId: true, createdAt: true, updatedAt: true,
  tags: true, // NEW
} satisfies Prisma.PropertySelect;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();

  if (!q) {
    const items = await prisma.property.findMany({
      where: { archived: false },
      orderBy: { addressLine1: "asc" },
      select: baseSelect,
    });
    return NextResponse.json({ items });
  }

  // Split on commas OR spaces to match Contacts behavior
  const tokens = q.split(/[,\s]+/).filter(Boolean);

  const AND: Prisma.PropertyWhereInput[] = tokens.map((tok) => {
    const ors: Prisma.PropertyWhereInput[] = [
      { addressLine1: { contains: tok, mode: "insensitive" } },
      { addressLine2: { contains: tok, mode: "insensitive" } },
      { city:        { contains: tok, mode: "insensitive" } },
      { ownerName:   { contains: tok, mode: "insensitive" } },
      { ownerEmail:  { contains: tok, mode: "insensitive" } },
      { ownerPhone:  { contains: tok, mode: "insensitive" } },
      { notes:       { contains: tok, mode: "insensitive" } },
      { tags: { has: tok } }, // tags array match is case-sensitive → we store lowercased
    ];

    if (["rent","rental","rentals","for","forrent"].includes(tok)) ors.push({ forType: "RENT" });
    if (["sale","buy","purchase","forsale"].includes(tok))        ors.push({ forType: "SALE" });

    const num = Number(tok.replace(/[^\d]/g, ""));
    if (!Number.isNaN(num)) {
      ors.push({ price: num }, { beds: num }, { baths: num });
    }

    return { OR: ors };
  });

  const where: Prisma.PropertyWhereInput = { archived: false, AND };

  const items = await prisma.property.findMany({
    where,
    orderBy: { addressLine1: "asc" },
    select: baseSelect,
  });

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const d = await req.json();
  const tags = normalizeTags(d.tags);

  const created = await prisma.property.create({
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
      archived: false,
      imageUrl: d.imageUrl ?? null,
      tags: tags ?? [], // store normalized (lowercased) tags
    },
    select: baseSelect,
  });
  return NextResponse.json(created);
}
