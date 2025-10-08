// app/api/properties/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  const where: Prisma.PropertyWhereInput = q
    ? {
        archived: false,
        OR: [
          { addressLine1: { contains: q, mode: "insensitive" as const } },
          { city:         { contains: q, mode: "insensitive" as const } },
          { ownerName:    { contains: q, mode: "insensitive" as const } },
        ],
      }
    : { archived: false };

  const items = await prisma.property.findMany({
    where,
    orderBy: { addressLine1: "asc" },
    select: {
      id: true, addressLine1: true, addressLine2: true, city: true,
      forType: true, price: true, beds: true, baths: true,
      ownerName: true, ownerPhone: true, ownerEmail: true,
      notes: true, archived: true, imageUrl: true,
      primaryClientId: true, createdAt: true, updatedAt: true,
    },
  });

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const d = await req.json();
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
    },
    select: {
      id: true, addressLine1: true, addressLine2: true, city: true,
      forType: true, price: true, beds: true, baths: true,
      ownerName: true, ownerPhone: true, ownerEmail: true,
      notes: true, archived: true, imageUrl: true,
      primaryClientId: true, createdAt: true, updatedAt: true,
    },
  });
  return NextResponse.json(created);
}
