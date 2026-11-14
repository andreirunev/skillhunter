// npm run db:init  -> create tables (CREATE TABLE IF NOT EXISTS)
// npm run db:seed  -> demo companies, tests, tasks, candidates (re-runnable)
// npm run db:reseed -> wipe the demo tests (tasks + event data) and seed again
// All read DATABASE_URL from .env.local via node --env-file.
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
      const fresh = process.argv.includes("--fresh");
      await seed(sql, { fresh });
      const rows = await sql<{ slug: string; sector: string; live_version: number; tests: number; tasks: number; candidates: number }[]>`
        SELECT c.slug, c.sector, c.live_version, count(DISTINCT t.id)::int AS tests,
          (SELECT count(*)::int FROM test_tasks tt JOIN tests t2 ON t2.id = tt.test_id WHERE t2.company_id = c.id) AS tasks,
          (SELECT count(*)::int FROM attempts a JOIN tests t3 ON t3.id = a.test_id WHERE t3.company_id = c.id) AS candidates
        FROM companies c LEFT JOIN tests t ON t.company_id = c.id
        GROUP BY c.id, c.slug, c.sector, c.live_version ORDER BY c.slug`;
      const [lib] = await sql<{ tasks: number; templates: number }[]>`
        SELECT (SELECT count(*)::int FROM task_library) AS tasks, (SELECT count(*)::int FROM role_templates) AS templates`;
      console.log(`db:seed${fresh ? " --fresh" : ""} ok. Library: ${lib.tasks} tasks, ${lib.templates} role templates. ${rows.length} companies:`);
      for (const r of rows) {
        const model = r.live_version ? `job simulation v${r.live_version}` : `older tasks: ${r.tasks}`;
        console.log(`  ${r.slug} (${r.sector}), ${model}, candidates: ${r.candidates}`);
      }
    } else {
      console.error("Usage: node --env-file=.env.local scripts/db.ts init|seed [--fresh]");
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
