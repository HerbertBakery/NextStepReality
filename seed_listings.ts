import { PrismaClient, ForType } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

function parseCSV(csvText: string) {
  const [headerLine, ...lines] = csvText.trim().split(/\r?\n/);
  const headers = headerLine.split(",").map((h) => h.trim());
  return lines
    .filter((l) => l.trim().length > 0)
    .map((line) => {
      const cells = line.split(",").map((c) => c.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, i) => (row[h] = cells[i] ?? ""));
      return row;
    });
}

function toEnumForType(input?: string): ForType {
  const v = (input || "").toUpperCase();
  return v === "RENT" ? ForType.RENT : ForType.SALE; // default to SALE
}

function toIntOrNull(input?: string): number | null {
  if (!input) return null;
  const n = parseInt(input.replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

function toIntOrUndefined(input?: string): number | undefined {
  const n = toIntOrNull(input);
  return n === null ? undefined : n;
}

async function main() {
  const csvPath = path.join(process.cwd(), "prisma", "listings_seed.csv");
  const csvText = fs.readFileSync(csvPath, "utf8");
  const rows = parseCSV(csvText);

  let created = 0,
    updated = 0,
    skipped = 0;

  for (const r of rows) {
    const address = r["Address"]?.trim();
    if (!address) {
      skipped++;
      continue;
    }

    const city = r["City"]?.trim() || "";
    const forType = toEnumForType(r["For Type"]);
    const price = toIntOrNull(r["Price"]);
    const beds = toIntOrUndefined(r["Beds"]);
    const baths = toIntOrUndefined(r["Baths"]);
    const ownerName = r["Owner/Agent"]?.trim() || undefined;
    const notes = r["Notes"]?.trim() || undefined;

    const existing = await prisma.property.findFirst({
      where: { addressLine1: address, city },
    });

    if (existing) {
      await prisma.property.update({
        where: { id: existing.id },
        data: {
          city,
          forType,
          price,
          beds,
          baths,
          ownerName,
          notes,
        },
      });
      updated++;
    } else {
      await prisma.property.create({
        data: {
          addressLine1: address,
          city,
          forType,
          price,
          beds,
          baths,
          ownerName,
          notes,
        },
      });
      created++;
    }
  }

  console.log(
    `Listings seed complete. Created: ${created}, Updated: ${updated}, Skipped (no address): ${skipped}`
  );
}

main().finally(() => prisma.$disconnect());
