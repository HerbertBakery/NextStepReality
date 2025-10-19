// app/api/clients/export/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const clients = await prisma.client.findMany({
    where: { archived: false },
    select: { firstName: true, lastName: true, email: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const rows = [
    ["First Name", "Last Name", "Email"],
    ...clients.map((c) => [c.firstName, c.lastName, c.email ?? ""]),
  ];

  const csv = rows
    .map((r) => r.map((v) => `"${(v ?? "").toString().replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="contacts_emails.csv"',
      "Cache-Control": "no-store",
    },
  });
}
