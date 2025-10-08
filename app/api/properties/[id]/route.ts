// app/api/properties/[id]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/properties/:id
 * Returns a single property by ID.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const one = await prisma.property.findUnique({ where: { id: params.id } });
  if (!one) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(one);
}

/**
 * PUT /api/properties/:id
 * Updates a property. Expects a JSON body.
 */
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const d = await req.json();

  const updated = await prisma.property.update({
    where: { id: params.id },
    data: {
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

      // ✅ make sure the uploaded URL is saved
      imageUrl: d.imageUrl ?? null,
    },
  });

  return NextResponse.json(updated);
}

/**
 * DELETE /api/properties/:id
 * Archives (soft-deletes) the property.
 */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.property.update({
    where: { id: params.id },
    data: { archived: true },
  });
  return NextResponse.json({ ok: true });
}
