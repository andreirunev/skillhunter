import { randomUUID } from "node:crypto";
import type postgres from "postgres";
import { makeAvatar } from "./avatar.ts";
import { makeInviteCode, makeToken, PRINTED_CODE_DAYS } from "./codes.ts";
import { computeFlags } from "./flags.ts";
import { PACKS, libraryTask } from "./library.ts";
import { matchesKey, type Answer, type TaskDef } from "./tasks.ts";

// Fictional companies, one per sector, so every trade is visible in the demo.
export const DEMO_COMPANIES = [
  { slug: "kirkas", name: "Kirkas Clean", sector: "cleaning", booth: "A12", color: "#0EA5E9", test: "Cleaning crew: practical check" },
  { slug: "silta", name: "Silta Build & Weld", sector: "construction", booth: "B04", color: "#F97316", test: "Site & welding basics" },
  { slug: "kulku", name: "Kulku Logistics", sector: "logistics", booth: "C07", color: "#10B981", test: "Warehouse & delivery check" },
  { slug: "pilvi", name: "Pilvi Code", sector: "it", booth: "D03", color: "#8B5CF6", test: "Junior developer check" },
];

// Each demo test = the company's sector pack + three general tasks.
const GENERAL_MIX = ["gen-pattern", "gen-apples", "gen-tea"];

// Unused printed booth codes kept per company, so /join works in the demo.
const DEMO_CODES = 5;

// Synthetic candidates per company; statuses are pretend recruiter decisions.
const CANDIDATE_STATUSES = ["new", "invited", "good_fit", "needs_review", "new", "new", "not_now", "new"];

// Deterministic PRNG (mulberry32) seeded from the company slug.
function rng(seedText: string) {
  let a = [...seedText].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 2654435761), 1779033703);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A plausible answer that differs from the key.
function wrongAnswer(task: TaskDef, rand: () => number): Answer {
  const key = task.key.value;
  const ids = (task.payload.options ?? []).map((o) => o.id);
  switch (task.type) {
    case "choice": {
      const others = ids.filter((id) => id !== key);
      return others[Math.floor(rand() * others.length)];
    }
    case "multi": {
      const k = key as string[];
      const extra = ids.find((id) => !k.includes(id));
      return rand() < 0.5 || !extra ? k.slice(1) : [...k, extra];
    }
    case "order": {
      const k = [...(key as string[])];
      const i = Math.floor(rand() * (k.length - 1));
      [k[i], k[i + 1]] = [k[i + 1], k[i]];
      return k;
    }
    case "match": {
      const k = { ...(key as Record<string, string>) };
      const [l1, l2] = Object.keys(k);
      [k[l1], k[l2]] = [k[l2], k[l1]];
      return k;
    }
    case "number":
      return (key as number) + (rand() < 0.5 ? 1 : -1) * (1 + Math.floor(rand() * 3));
  }
}

// Safe to re-run: companies are upserted, a test gets tasks and candidates
// only when it has none. `fresh` first wipes the demo tests' tasks and event data.
export async function seed(sql: postgres.Sql, { fresh = false } = {}) {
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
    const [test] = await sql<{ id: string }[]>`SELECT id FROM tests WHERE company_id = ${company.id}::uuid LIMIT 1`;

    if (fresh) {
      await sql`DELETE FROM attempts WHERE test_id = ${test.id}::uuid`;
      await sql`DELETE FROM qr_tokens WHERE test_id = ${test.id}::uuid`;
      await sql`DELETE FROM test_tasks WHERE test_id = ${test.id}::uuid`;
    }

    // Tasks
    let tasks: { id: string; position: number }[] = await sql<{ id: string; position: number }[]>`
      SELECT id, position FROM test_tasks WHERE test_id = ${test.id}::uuid ORDER BY position`;
    const defs = [
      ...PACKS.find((p) => p.sector === c.sector)!.tasks,
      ...GENERAL_MIX.map((id) => libraryTask(id)!),
    ];
    if (tasks.length === 0) {
      const rows = defs.map((t, position) => ({
        id: randomUUID(),
        test_id: test.id,
        position,
        type: t.type,
        payload: sql.json(t.payload),
        answer_key: sql.json(t.key),
        expected_sec: t.expectedSec,
        skill: t.skill,
        sector: t.sector,
        follow_ups: sql.json(t.followUps),
      }));
      await sql`INSERT INTO test_tasks ${sql(rows)}`;
      tasks = rows.map((r) => ({ id: r.id, position: r.position }));
    }

    // Printed booth codes for /join: keep a few unused ones per company.
    const [{ unused }] = await sql<{ unused: number }[]>`
      SELECT count(*)::int AS unused FROM qr_tokens
      WHERE test_id = ${test.id}::uuid AND status = 'new' AND expires_at > now()`;
    if (unused < DEMO_CODES) {
      const expiresAt = new Date(Date.now() + PRINTED_CODE_DAYS * 86_400_000);
      const codes = Array.from({ length: DEMO_CODES - unused }, () => ({ token: makeToken(), test_id: test.id, expires_at: expiresAt }));
      await sql`INSERT INTO qr_tokens ${sql(codes)} ON CONFLICT (token) DO NOTHING`;
    }

    // Synthetic candidates, only for the demo mix of tasks.
    const [{ n }] = await sql<{ n: number }[]>`SELECT count(*)::int AS n FROM attempts WHERE test_id = ${test.id}::uuid`;
    if (n > 0 || tasks.length !== defs.length) continue;

    const rand = rng(c.slug);
    const now = Date.now();
    const attempts: Record<string, unknown>[] = [];
    const answers: Record<string, unknown>[] = [];
    const invitations: Record<string, unknown>[] = [];
    for (let i = 0; i < CANDIDATE_STATUSES.length; i++) {
      const id = randomUUID();
      const ability = 0.45 + rand() * 0.5;
      const ownPace = i === 5;
      const avatar = makeAvatar(rand);
      const startedAt = now - (25 + i * 17 + Math.floor(rand() * 10)) * 60_000;
      const answeredCount = i === 0 ? Math.ceil(defs.length / 2) : defs.length; // #0 is still in progress
      let elapsed = 40_000; // activation + avatar
      defs.slice(0, answeredCount).forEach((def, idx) => {
        const r = rand();
        const factor = r < 0.06 ? 0.1 : r > 0.94 ? 3.5 + rand() * 1.5 : 0.6 + rand() * (ownPace ? 1.6 : 1.0);
        const timeMs = Math.round(def.expectedSec * 1000 * factor);
        const skipped = rand() < 0.03;
        const answer = skipped ? null : rand() < ability ? def.key.value : wrongAnswer(def, rand);
        const changes = rand() < 0.08 ? 3 + Math.floor(rand() * 2) : Math.floor(rand() * 2);
        elapsed += timeMs;
        answers.push({
          attempt_id: id,
          task_id: tasks[idx].id,
          answer: answer === null ? null : sql.json(answer),
          matches_key: matchesKey(def.type, answer, def.key),
          time_ms: timeMs,
          changes,
          flags: sql.json(computeFlags({ timeMs, expectedSec: def.expectedSec, changes, ownPace, skipped })),
        });
      });
      const status = CANDIDATE_STATUSES[i];
      attempts.push({
        id,
        test_id: test.id,
        avatar_name: avatar.name,
        avatar_emoji: avatar.emoji,
        avatar_color: avatar.color,
        lang: ["en", "fi", "sv", "en"][Math.floor(rand() * 4)],
        own_pace: ownPace,
        started_at: new Date(startedAt),
        finished_at: answeredCount === defs.length ? new Date(startedAt + elapsed) : null,
        status,
      });
      if (status === "invited") invitations.push({ attempt_id: id, code: makeInviteCode(), sent_at: new Date(startedAt + elapsed + 120_000) });
    }
    await sql`INSERT INTO attempts ${sql(attempts)}`;
    await sql`INSERT INTO answers ${sql(answers)}`;
    if (invitations.length) await sql`INSERT INTO invitations ${sql(invitations)}`;
  }
}
