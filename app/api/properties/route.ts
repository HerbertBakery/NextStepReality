// app/api/properties/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/properties?q=search
 * Returns non-archived properties (optionally filtered by a search query).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  const where = q
    ? {
        archived: false,
        OR: [
          { addressLine1: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
          { ownerName: { contains: q, mode: "insensitive" } },
        ],
      }
    : { archived: false };

  const items = await prisma.property.findMany({
    where,
    orderBy: { addressLine1: "asc" },
    // If you ever add a select here, make sure to include imageUrl.
    // select: { id: true, addressLine1: true, city: true, imageUrl: true, ... }
  });

  return NextResponse.json({ items });
}

/**
 * POST /api/properties
 * Creates a new property. Expects a JSON body.
 */
export async function POST(req: Request) {
  const d = await req.json();

  const created = await prisma.property.create({
    data: {
      addressLine1: d.addressLine1 || "",
      addressLine2: d.addressLine2 || null,
      city: d.city || "",
      province: d.province || null,
      postalCode: d.postalCode || null,
      forType: d.forType || "RENT", // or enum if defined in Prisma
      price: d.price ?? null,
      beds: d.beds ?? null,
      baths: d.baths ?? null,
      ownerName: d.ownerName || null,
      ownerPhone: d.ownerPhone || null,
      ownerEmail: d.ownerEmail || null,
      notes: d.notes || null,
      primaryClientId: d.primaryClientId || null,
      archived: false,

      // ✅ persist blob/public URL set on the client after /api/upload
      imageUrl: d.imageUrl ?? null,
    },
  });

  return NextResponse.json(created);
}
