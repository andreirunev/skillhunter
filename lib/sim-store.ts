import { randomUUID } from "node:crypto";
import type postgres from "postgres";
import { db } from "./db.ts";
import { LIBRARY_TASKS, ROLE_TEMPLATES } from "./sim-library.ts";
import { isValidKey, type AnyPayload, type LibraryTask, type RoleTemplate, type SimKey, type SimTask, type TemplateDuty } from "./sim.ts";
import { SKILLS, type AnswerKey, type Skill, type TaskPayload, type TaskType } from "./tasks.ts";

// Server side of the job simulation: the library, role templates, publishing
// a company test (a frozen snapshot) and reading the tasks of an attempt.

export const DEFAULT_TIME_LIMIT = 20;
export const TIME_LIMIT_RANGE = { min: 5, max: 60 };
export const DUTY_RANGE = { min: 1, max: 8 };

// Upserted by the seed, so edits to lib/sim-library.ts reach the database.
export async function seedLibrary(sql: postgres.Sql) {
  const rows = LIBRARY_TASKS.map((t) => ({
    id: t.id,
    format: t.format,
    role_tags: t.role_tags,
    title: t.title,
    duty_hint: t.duty_hint,
    skill_tag: t.skill_tag,
    skill_kind: t.skill_kind,
    expected_seconds: t.expected_seconds,
    payload: sql.json(t.payload),
    key: t.key === null ? null : sql.json(t.key),
    key_kind: t.key_kind,
    good_looks_like: t.good_looks_like,
    not_measure_note: t.not_measure_note,
    followups: t.followups,
    default_order: t.default_order,
  }));
  await sql`
    INSERT INTO task_library ${sql(rows)}
    ON CONFLICT (id) DO UPDATE SET
      format = EXCLUDED.format, role_tags = EXCLUDED.role_tags, title = EXCLUDED.title, duty_hint = EXCLUDED.duty_hint,
      skill_tag = EXCLUDED.skill_tag, skill_kind = EXCLUDED.skill_kind, expected_seconds = EXCLUDED.expected_seconds,
      payload = EXCLUDED.payload, key = EXCLUDED.key, key_kind = EXCLUDED.key_kind, good_looks_like = EXCLUDED.good_looks_like,
      not_measure_note = EXCLUDED.not_measure_note, followups = EXCLUDED.followups, default_order = EXCLUDED.default_order`;
  for (const r of ROLE_TEMPLATES) {
    await sql`
      INSERT INTO role_templates (slug, name, summary, duties)
      VALUES (${r.slug}, ${r.name}, ${r.summary}, ${sql.json(r.duties)})
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, summary = EXCLUDED.summary, duties = EXCLUDED.duties`;
  }
}

export async function listLibrary(sql: postgres.Sql = db()): Promise<LibraryTask[]> {
  const rows = await sql<LibraryTask[]>`
    SELECT id, format, role_tags, title, duty_hint, skill_tag, skill_kind, expected_seconds, payload, key, key_kind,
      good_looks_like, not_measure_note, followups, default_order
    FROM task_library ORDER BY default_order, id`;
  return [...rows];
}

export async function listTemplates(sql: postgres.Sql = db()): Promise<RoleTemplate[]> {
  const rows = await sql<RoleTemplate[]>`SELECT slug, name, summary, duties FROM role_templates ORDER BY name`;
  return [...rows];
}

// The builder's draft. Only these task fields can be changed per company;
// everything else is copied from the library at publish time.
export type DraftDuty = { title: string; libraryId: string; followups?: string[]; good_looks_like?: string[]; key?: SimKey };
export type Draft = { roleSlug: string | null; title: string; timeLimit: number; englishRequired: boolean; duties: DraftDuty[] };

const cleanLines = (x: unknown, max: number): string[] | null =>
  Array.isArray(x)
    ? x.filter((l): l is string => typeof l === "string").map((l) => l.trim().slice(0, 200)).filter(Boolean).slice(0, max)
    : null;

// Validates the draft and builds the snapshot. Returns an error code or the
// tasks + duties to store.
export function buildSnapshot(draft: Draft, library: LibraryTask[]):
  { error: string } | { tasks: SimTask[]; duties: TemplateDuty[]; title: string; timeLimit: number } {
  const title = String(draft.title ?? "").trim().slice(0, 80);
  if (!title) return { error: "missing_title" };
  const timeLimit = Math.round(Number(draft.timeLimit));
  if (!(timeLimit >= TIME_LIMIT_RANGE.min && timeLimit <= TIME_LIMIT_RANGE.max)) return { error: "bad_time_limit" };
  if (!Array.isArray(draft.duties) || draft.duties.length < DUTY_RANGE.min || draft.duties.length > DUTY_RANGE.max) return { error: "bad_duty_count" };

  const tasks: SimTask[] = [];
  const duties: TemplateDuty[] = [];
  for (const [i, d] of draft.duties.entries()) {
    const lib = library.find((t) => t.id === d?.libraryId);
    if (!lib) return { error: "missing_task" };
    const dutyTitle = String(d.title ?? "").trim().slice(0, 120) || lib.duty_hint;
    const followups = cleanLines(d.followups, 6) ?? lib.followups;
    const good = cleanLines(d.good_looks_like, 5) ?? lib.good_looks_like;
    if (followups.length === 0 || good.length === 0) return { error: "empty_guide" };
    let key: SimKey = lib.key;
    if (d.key !== undefined && lib.key_kind !== "none" && lib.format !== "quick_logic") {
      if (!isValidKey(lib.format, lib.payload, lib.key_kind, d.key)) return { error: "bad_key" };
      key = d.key;
    }
    const id = randomUUID();
    tasks.push({
      id,
      library_id: lib.id,
      duty: dutyTitle,
      format: lib.format,
      title: lib.title,
      skill_tag: lib.skill_tag,
      skill_kind: lib.skill_kind,
      expected_seconds: lib.expected_seconds,
      payload: lib.payload,
      key,
      key_kind: lib.key_kind,
      good_looks_like: good,
      not_measure_note: lib.not_measure_note,
      followups,
    });
    duties.push({ id: `d${i + 1}`, title: dutyTitle, task_id: id });
  }
  return { tasks, duties, title, timeLimit };
}

// Publish = a new frozen version. Attempts already started keep the version
// they were given; new attempts get this one. Bumps companies.live_version.
export async function publishTest(sql: postgres.Sql, companyId: string, draft: Draft):
  Promise<{ error: string } | { version: number }> {
  const built = buildSnapshot(draft, await listLibrary(sql));
  if ("error" in built) return built;
  const roleSlug = typeof draft.roleSlug === "string" ? draft.roleSlug.slice(0, 60) : null;
  return sql.begin(async (tx) => {
    const [company] = await tx<{ live_version: number }[]>`
      SELECT live_version FROM companies WHERE id = ${companyId}::uuid FOR UPDATE`;
    if (!company) return { error: "unknown_company" };
    const [{ next }] = await tx<{ next: number }[]>`
      SELECT coalesce(max(version), 0)::int + 1 AS next FROM company_tests WHERE company_id = ${companyId}::uuid`;
    await tx`
      INSERT INTO company_tests (company_id, version, title, role_slug, duties, tasks, time_limit_minutes, english_required)
      VALUES (${companyId}::uuid, ${next}, ${built.title}, ${roleSlug}, ${tx.json(built.duties)}, ${tx.json(built.tasks)},
        ${built.timeLimit}, ${Boolean(draft.englishRequired)})`;
    await tx`UPDATE companies SET live_version = ${next} WHERE id = ${companyId}::uuid`;
    await tx`UPDATE tests SET title = ${built.title} WHERE company_id = ${companyId}::uuid`;
    return { version: next };
  });
}

export type LiveTest = {
  id: string;
  version: number;
  title: string;
  role_slug: string | null;
  duties: TemplateDuty[];
  tasks: SimTask[];
  time_limit_minutes: number;
  english_required: boolean;
  published_at: Date;
};

// The version new candidates get, or null while the company still uses the
// older task list (test_tasks).
export async function getLiveTest(companyId: string): Promise<LiveTest | null> {
  const [row] = await db()<LiveTest[]>`
    SELECT ct.id, ct.version, ct.title, ct.role_slug, ct.duties, ct.tasks, ct.time_limit_minutes, ct.english_required, ct.published_at
    FROM companies c JOIN company_tests ct ON ct.company_id = c.id AND ct.version = c.live_version
    WHERE c.id = ${companyId}::uuid`;
  return row ?? null;
}

type LegacyRow = { id: string; type: TaskType; payload: TaskPayload; answer_key: AnswerKey; expected_sec: number; skill: Skill; follow_ups: string[] };

// Older task rows shown through the simulation model as quick_logic.
export function legacyToSim(r: LegacyRow): SimTask {
  return {
    id: r.id,
    library_id: "legacy",
    duty: "",
    format: "quick_logic",
    title: r.payload.title,
    skill_tag: SKILLS[r.skill] ?? r.skill,
    skill_kind: "hard",
    expected_seconds: r.expected_sec,
    payload: { ...r.payload, kind: r.type } as AnyPayload,
    key: r.answer_key,
    key_kind: "exact",
    good_looks_like: [],
    not_measure_note: "",
    followups: r.follow_ups,
  };
}

export async function legacyTasks(testId: string, sql: postgres.Sql = db()): Promise<SimTask[]> {
  const rows = await sql<LegacyRow[]>`
    SELECT id, type, payload, answer_key, expected_sec, skill, follow_ups FROM test_tasks
    WHERE test_id = ${testId}::uuid ORDER BY position`;
  return rows.map(legacyToSim);
}

// All tasks of one attempt, keys included (server only): the snapshot of the
// version it was given, or the older task list for attempts made before.
export async function attemptTasks(attemptId: string): Promise<SimTask[] | null> {
  const sql = db();
  const [row] = await sql<{ test_id: string; tasks: SimTask[] | null }[]>`
    SELECT a.test_id, ct.tasks FROM attempts a LEFT JOIN company_tests ct ON ct.id = a.company_test_id
    WHERE a.id = ${attemptId}::uuid`;
  if (!row) return null;
  return row.tasks ?? legacyTasks(row.test_id, sql);
}
