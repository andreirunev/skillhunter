import { randomUUID } from "node:crypto";
import type postgres from "postgres";
import { makeAvatar } from "./avatar.ts";
import { makeInviteCode, makeToken, PRINTED_CODE_DAYS } from "./codes.ts";
import { computeFlags } from "./flags.ts";
import { PACKS, libraryTask } from "./library.ts";
import { compareSim, type QuickPayload, type SimPayload, type SimTask } from "./sim.ts";
import { DEFAULT_TIME_LIMIT, legacyTasks, listTemplates, publishTest, seedLibrary } from "./sim-store.ts";
import type { Answer, AnswerKey, TaskPayload, TaskType } from "./tasks.ts";

// Fictional companies, one per sector, so every trade is visible in the demo.
// `role`: the role template published as the company's job simulation. The
// others keep the older abstract task list, which still works.
export const DEMO_COMPANIES = [
  { slug: "kirkas", name: "Kirkas Clean", sector: "cleaning", booth: "A12", color: "#0EA5E9", test: "Cleaning crew: practical check", role: null },
  { slug: "silta", name: "Silta Build & Weld", sector: "construction", booth: "B04", color: "#F97316", test: "Site & welding basics", role: null },
  { slug: "kulku", name: "Kulku Logistics", sector: "logistics", booth: "C07", color: "#10B981", test: "Warehouse & delivery check", role: "warehouse" },
  { slug: "pilvi", name: "Pilvi Code", sector: "it", booth: "D03", color: "#8B5CF6", test: "Junior developer check", role: "junior-developer" },
];

// Each older demo test = the company's sector pack + three general tasks.
const GENERAL_MIX = ["gen-pattern", "gen-apples", "gen-tea"];

// Unused printed booth codes kept per company, so /join works in the demo.
const DEMO_CODES = 5;

// Synthetic candidates per company; statuses are pretend recruiter decisions.
const CANDIDATE_STATUSES = ["new", "invited", "good_fit", "needs_review", "at_booth", "interview", "not_now", "new"];

// Booth flow stage that goes with a seeded status. The one full-interview
// candidate per company gets an obviously fake contact (test data).
const STAGE_FOR: Record<string, string> = { at_booth: "mini_interview", interview: "full_interview" };
const TEST_CONTACT = { full_name: "Test Candidate", phone: "+358 00 000 0000", email: "test.candidate@example.com" };

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

const pick = <T,>(list: T[], rand: () => number) => list[Math.floor(rand() * list.length)];

// A plausible answer that differs from the key (older task types).
function wrongQuick(type: TaskType, payload: TaskPayload, key: AnswerKey["value"], rand: () => number): Answer {
  const ids = (payload.options ?? []).map((o) => o.id);
  switch (type) {
    case "choice":
      return pick(ids.filter((id) => id !== key), rand);
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

// One synthetic answer: the key / typical answer when `same`, otherwise a
// plausible different one. Tasks without a typical answer get any option.
function sampleAnswer(task: SimTask, same: boolean, rand: () => number): Answer {
  if (task.format === "quick_logic") {
    const p = task.payload as QuickPayload;
    const value = (task.key as AnswerKey).value;
    return same ? value : wrongQuick(p.kind, p, value, rand);
  }
  const p = task.payload as SimPayload;
  const optionIds = (p.options ?? []).map((o) => o.id);
  if (task.key_kind === "none" || task.key === null) return pick(optionIds, rand);
  const key = task.key as string | string[];
  const keyIds = Array.isArray(key) ? key : [key];
  switch (task.format) {
    case "triage": {
      const order = [...keyIds];
      if (!same) {
        const i = Math.floor(rand() * (order.length - 1));
        [order[i], order[i + 1]] = [order[i + 1], order[i]];
      }
      return order;
    }
    case "spot_error": {
      if (same) return [...keyIds];
      const others = (p.panels ?? []).filter((pn) => !pn.ref).flatMap((pn) => (pn.fields ?? []).map((f) => f.id)).filter((id) => !keyIds.includes(id));
      return keyIds.length > 1 && rand() < 0.6 ? keyIds.slice(1) : [...keyIds, pick(others, rand)];
    }
    default:
      return same ? pick(keyIds, rand) : pick(optionIds.filter((id) => !keyIds.includes(id)), rand);
  }
}

// Safe to re-run: companies, the task library and role templates are
// upserted; a test gets tasks and candidates only when it has none. A company
// with a role is published from its template once (live_version 0 -> 1).
// `fresh` first wipes the demo tests' tasks, published versions and event data.
export async function seed(sql: postgres.Sql, { fresh = false } = {}) {
  await seedLibrary(sql);
  const templates = await listTemplates(sql);

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
      await sql`DELETE FROM company_tests WHERE company_id = ${company.id}::uuid`;
      await sql`UPDATE companies SET live_version = 0 WHERE id = ${company.id}::uuid`;
      await sql`UPDATE tests SET title = ${c.test} WHERE id = ${test.id}::uuid`;
    }

    // Older task list (kept for every company; the fallback before publishing).
    const [{ count }] = await sql<{ count: number }[]>`SELECT count(*)::int AS count FROM test_tasks WHERE test_id = ${test.id}::uuid`;
    const defs = [
      ...PACKS.find((p) => p.sector === c.sector)!.tasks,
      ...GENERAL_MIX.map((id) => libraryTask(id)!),
    ];
    if (count === 0) {
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
    }

    // Job simulation from the role template, published once.
    const template = templates.find((t) => t.slug === c.role);
    if (template) {
      const [{ live_version }] = await sql<{ live_version: number }[]>`SELECT live_version FROM companies WHERE id = ${company.id}::uuid`;
      if (live_version === 0) {
        await publishTest(sql, company.id, {
          roleSlug: template.slug,
          title: `${template.name}: job simulation`,
          timeLimit: DEFAULT_TIME_LIMIT,
          englishRequired: false,
          duties: template.duties.map((d) => ({ title: d.title, libraryId: d.task_id })),
        });
      }
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

    // Synthetic candidates, only for a company with none yet: on the live
    // version if there is one, else on the older demo task list.
    const [{ n }] = await sql<{ n: number }[]>`SELECT count(*)::int AS n FROM attempts WHERE test_id = ${test.id}::uuid`;
    if (n > 0) continue;
    const [live] = await sql<{ id: string; tasks: SimTask[]; time_limit_minutes: number }[]>`
      SELECT ct.id, ct.tasks, ct.time_limit_minutes FROM companies co
      JOIN company_tests ct ON ct.company_id = co.id AND ct.version = co.live_version
      WHERE co.id = ${company.id}::uuid`;
    const tasks = live ? live.tasks : await legacyTasks(test.id, sql);
    if (!live && tasks.length !== defs.length) continue;

    const rand = rng(c.slug);
    const now = Date.now();
    const attempts: Record<string, unknown>[] = [];
    const answers: Record<string, unknown>[] = [];
    const invitations: Record<string, unknown>[] = [];
    for (let i = 0; i < CANDIDATE_STATUSES.length; i++) {
      const id = randomUUID();
      const ability = 0.45 + rand() * 0.5;
      const avatar = makeAvatar(rand);
      const startedAt = now - (25 + i * 17 + Math.floor(rand() * 10)) * 60_000;
      const answeredCount = i === 0 ? Math.ceil(tasks.length / 2) : tasks.length; // #0 is still in progress
      let elapsed = 40_000; // activation + avatar
      for (const task of tasks.slice(0, answeredCount)) {
        const r = rand();
        const factor = r < 0.06 ? 0.1 : r > 0.94 ? 3.5 + rand() * 1.5 : 0.6 + rand();
        const timeMs = Math.round(task.expected_seconds * 1000 * factor);
        const skipped = rand() < 0.03;
        const answer = skipped ? null : sampleAnswer(task, rand() < ability, rand);
        const changes = rand() < 0.08 ? 3 + Math.floor(rand() * 2) : Math.floor(rand() * 2);
        elapsed += timeMs;
        answers.push({
          attempt_id: id,
          task_id: task.id,
          answer: answer === null ? null : sql.json(answer),
          matches_key: compareSim(task, answer),
          time_ms: timeMs,
          changes,
          flags: sql.json(computeFlags({ timeMs, expectedSec: task.expected_seconds, changes, skipped })),
        });
      }
      const status = CANDIDATE_STATUSES[i];
      attempts.push({
        id,
        test_id: test.id,
        company_test_id: live?.id ?? null,
        time_limit_minutes: live?.time_limit_minutes ?? DEFAULT_TIME_LIMIT,
        avatar_name: avatar.name,
        avatar_emoji: avatar.emoji,
        avatar_color: avatar.color,
        lang: ["en", "fi", "sv", "en"][Math.floor(rand() * 4)],
        started_at: new Date(startedAt),
        finished_at: answeredCount === tasks.length ? new Date(startedAt + elapsed) : null,
        status,
        stage: STAGE_FOR[status] ?? "anonymous",
        contact: status === "interview" ? sql.json(TEST_CONTACT) : null,
      });
      if (status in STAGE_FOR || status === "invited") {
        let code = makeInviteCode();
        while (invitations.some((inv) => inv.code === code)) code = makeInviteCode();
        invitations.push({ attempt_id: id, code, sent_at: new Date(startedAt + elapsed + 120_000) });
      }
    }
    await sql`INSERT INTO attempts ${sql(attempts)}`;
    await sql`INSERT INTO answers ${sql(answers)}`;
    if (invitations.length) await sql`INSERT INTO invitations ${sql(invitations)}`;
  }
}
