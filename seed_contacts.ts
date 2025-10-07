
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
  const csvPath = path.join(process.cwd(), "prisma", "contacts_under_2m_west.csv");
  const csvText = fs.readFileSync(csvPath, "utf8");
  const rows = parseCSV(csvText);

  let created = 0, updated = 0, skipped = 0;
  for (const r of rows) {
    const email = r["Email"]?.toLowerCase();
    if (!email) { skipped++; continue; }

    const firstName = r["First Name"] || "";
    const lastName = r["Last Name"] || "";
    const tags = r["Tags"] || null;

    const existing = await prisma.client.findUnique({ where: { email } as any });
    if (existing) {
      await prisma.client.update({
        where: { id: existing.id },
        data: {
          firstName: firstName || existing.firstName,
          lastName: lastName || existing.lastName,
          tags: tags ?? existing.tags,
        }
      });
      updated++;
    } else {
      await prisma.client.create({
        data: { firstName, lastName, email, tags }
      });
      created++;
    }
  }

  console.log(`Done. Created: ${created}, Updated: ${updated}, Skipped(no email): ${skipped}`);
}

main().finally(() => prisma.$disconnect());
