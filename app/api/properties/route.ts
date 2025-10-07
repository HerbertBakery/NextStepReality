import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const items = await prisma.property.findMany({
    where: q ? {
      OR: [
        { addressLine1: { contains: q, mode: "insensitive" } },
        { addressLine2: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { ownerName: { contains: q, mode: "insensitive" } },
      ],
      archived: false,
    } : { archived: false },
    orderBy: { updatedAt: "desc" }
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const d = await req.json();
  const created = await prisma.property.create({ data: {
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
  return NextResponse.json(created);
}
