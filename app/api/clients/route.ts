import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const items = await prisma.client.findMany({
    where: q ? {
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { tags: { contains: q, mode: "insensitive" } },
      ],
      archived: false,
    } : { archived: false },
    orderBy: { updatedAt: "desc" }
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const data = await req.json();
  const created = await prisma.client.create({ data: {
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
  }});
  return NextResponse.json(created);
}
