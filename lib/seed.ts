import type postgres from "postgres";

// Fictional companies, one per sector, so every trade is visible in the demo.
export const DEMO_COMPANIES = [
  { slug: "kirkas", name: "Kirkas Clean", sector: "cleaning", booth: "A12", color: "#0EA5E9", test: "Cleaning crew: practical check" },
  { slug: "silta", name: "Silta Build & Weld", sector: "construction", booth: "B04", color: "#F97316", test: "Site & welding basics" },
  { slug: "kulku", name: "Kulku Logistics", sector: "logistics", booth: "C07", color: "#10B981", test: "Warehouse & delivery check" },
  { slug: "pilvi", name: "Pilvi Code", sector: "it", booth: "D03", color: "#8B5CF6", test: "Junior developer check" },
];

// Safe to re-run: companies are upserted by slug, a test is added only if missing.
export async function seed(sql: postgres.Sql) {
  for (const c of DEMO_COMPANIES) {
    const [company] = await sql<{ id: string }[]>`
      INSERT INTO companies (slug, name, sector, booth, color)
      VALUES (${c.slug}, ${c.name}, ${c.sector}, ${c.booth}, ${c.color})
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name, sector = EXCLUDED.sector, booth = EXCLUDED.booth, color = EXCLUDED.color
      RETURNING id`;
    await sql`
      INSERT INTO tests (company_id, title)
      SELECT ${company.id}::uuid, ${c.test}
      WHERE NOT EXISTS (SELECT 1 FROM tests WHERE company_id = ${company.id}::uuid)`;
  }
}
