
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

function parseCSV(csvText: string) {
  const [headerLine, ...lines] = csvText.trim().split(/\r?\n/);
  const headers = headerLine.split(",").map(h => h.trim());
  return lines.map(line => {
    const cells = line.split(",").map(c => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => row[h] = cells[i] ?? "");
    return row;
  });
}

async function main() {
  const csvPath = path.join(process.cwd(), "prisma", "listings_seed.csv");
  const csvText = fs.readFileSync(csvPath, "utf8");
  const rows = parseCSV(csvText);

  let created = 0, updated = 0, skipped = 0;
  for (const r of rows) {
    const address = r["Address"];
    if (!address) { skipped++; continue; }

    const city = r["City"] || "";
    const forType = (r["For Type"] || "SALE").toUpperCase();
    const price = r["Price"] || "";
    const beds = parseInt(r["Beds"] || "0", 10);
    const baths = parseInt(r["Baths"] || "0", 10);
    const ownerName = r["Owner/Agent"] || "";
    const notes = r["Notes"] || "";

    const existing = await prisma.property.findFirst({ where: { addressLine1: address } });
    if (existing) {
      await prisma.property.update({
        where: { id: existing.id },
        data: { city, forType, price: parseInt(price.replace(/[^0-9]/g, "")) || null, beds, baths, ownerName, notes }
      });
      updated++;
    } else {
      await prisma.property.create({
        data: { addressLine1: address, city, forType, price: parseInt(price.replace(/[^0-9]/g, "")) || null, beds, baths, ownerName, notes }
      });
      created++;
    }
  }

  console.log(`Done. Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
}

main().finally(() => prisma.$disconnect());
