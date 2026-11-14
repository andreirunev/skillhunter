import type { Db } from "./db";

// Fictional companies, one per sector, so every trade is visible in the demo.
export const DEMO_COMPANIES = [
  { slug: "kirkas", name: "Kirkas Clean", sector: "cleaning", booth: "A12", color: "#0EA5E9", test: "Cleaning crew: practical check" },
  { slug: "silta", name: "Silta Build & Weld", sector: "construction", booth: "B04", color: "#F97316", test: "Site & welding basics" },
  { slug: "kulku", name: "Kulku Logistics", sector: "logistics", booth: "C07", color: "#10B981", test: "Warehouse & delivery check" },
  { slug: "pilvi", name: "Pilvi Code", sector: "it", booth: "D03", color: "#8B5CF6", test: "Junior developer check" },
];

// Called inside the boot transaction when the database is empty.
export function seed(db: Db) {
  const insertCompany = db.prepare(
    "INSERT INTO companies (slug, name, sector, booth, color) VALUES (?, ?, ?, ?, ?)",
  );
  const insertTest = db.prepare("INSERT INTO tests (company_id, title) VALUES (?, ?)");
  for (const c of DEMO_COMPANIES) {
    const { lastInsertRowid } = insertCompany.run(c.slug, c.name, c.sector, c.booth, c.color);
    insertTest.run(lastInsertRowid, c.test);
  }
}
