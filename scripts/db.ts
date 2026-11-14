// npm run db:init  -> create tables (CREATE TABLE IF NOT EXISTS)
// npm run db:seed  -> upsert the demo companies (re-runnable)
// Both read DATABASE_URL from .env.local via node --env-file.
import { db, SCHEMA } from "../lib/db.ts";
import { seed } from "../lib/seed.ts";

// Errors from the driver can contain the host or user name: never print them raw.
function redact(message: string) {
  let parts: string[];
  try {
    const url = new URL(process.env.DATABASE_URL ?? "");
    parts = [url.password, decodeURIComponent(url.password), url.username, url.hostname];
  } catch {
    return message;
  }
  for (const part of parts) if (part) message = message.split(part).join("***");
  return message;
}

const command = process.argv[2];
try {
  const sql = db();
  try {
    if (command === "init") {
      await sql.unsafe(SCHEMA);
      const tables = await sql<{ name: string }[]>`
        SELECT table_name AS name FROM information_schema.tables
        WHERE table_schema = 'public' ORDER BY table_name`;
      console.log(`db:init ok. Tables: ${tables.map((t) => t.name).join(", ")}`);
    } else if (command === "seed") {
      await seed(sql);
      const rows = await sql<{ slug: string; sector: string; tests: number }[]>`
        SELECT c.slug, c.sector, count(t.id)::int AS tests
        FROM companies c LEFT JOIN tests t ON t.company_id = c.id
        GROUP BY c.slug, c.sector ORDER BY c.slug`;
      console.log(`db:seed ok. ${rows.length} companies:`);
      for (const r of rows) console.log(`  ${r.slug} (${r.sector}), tests: ${r.tests}`);
    } else {
      console.error("Usage: node --env-file=.env.local scripts/db.ts init|seed");
      process.exitCode = 1;
    }
  } finally {
    await sql.end();
  }
} catch (error) {
  const e = error as { code?: string; message?: string };
  console.error(`db:${command} failed${e.code ? ` [${e.code}]` : ""}: ${redact(e.message ?? String(error))}`);
  process.exitCode = 1;
}
