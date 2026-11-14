import { cache } from "react";
import { db } from "./db.ts";
import { isUuid } from "./data.ts";
import { makeInviteCode, PRINTED_CODE_DAYS } from "./codes.ts";
import type { FlagCode } from "./flags.ts";
import type { Answer } from "./tasks.ts";
import type { SimTask } from "./sim.ts";
import { attemptTasks, DEFAULT_TIME_LIMIT } from "./sim-store.ts";
import type { Lang } from "./i18n.ts";
import type { TicketTemplate } from "./tickets.ts";
import { isInviteCode, normalizeInviteCode, type Contact, type RecruiterStage, type Stage } from "./stage.ts";
import { closeExpiredForTest } from "./timing.ts";

// Recruiter-side data. Demo access is by company slug; a real deployment puts
// staff login in front of this. Nothing here scores, ranks or sorts by results.

export const STATUSES = ["new", "invited", "at_booth", "good_fit", "needs_review", "interview", "not_now", "declined"] as const;
export type Status = (typeof STATUSES)[number];
export const isStatus = (x: unknown): x is Status => typeof x === "string" && (STATUSES as readonly string[]).includes(x);

// task_count / expected_sec / time_limit_minutes describe what a new
// candidate gets: the live published version, else the older task list.
export type Company = {
  id: string; slug: string; name: string; sector: string; booth: string; color: string; ticket: unknown;
  test_id: string; test_title: string; task_count: number; expected_sec: number;
  live_version: number; time_limit_minutes: number;
};

// Cached per request: the recruiter layout and its page both read it.
export const getCompany = cache(async (slug: string): Promise<Company | null> => {
  const [row] = await db()<Company[]>`
    SELECT c.id, c.slug, c.name, c.sector, c.booth, c.color, c.ticket, c.live_version, t.id AS test_id,
      coalesce(ct.title, t.title) AS test_title,
      coalesce(jsonb_array_length(ct.tasks), (SELECT count(*)::int FROM test_tasks WHERE test_id = t.id)) AS task_count,
      coalesce((SELECT sum((x->>'expected_seconds')::int)::int FROM jsonb_array_elements(ct.tasks) x),
        (SELECT coalesce(sum(expected_sec), 0)::int FROM test_tasks WHERE test_id = t.id)) AS expected_sec,
      coalesce(ct.time_limit_minutes, ${DEFAULT_TIME_LIMIT}) AS time_limit_minutes
    FROM companies c JOIN tests t ON t.company_id = c.id
    LEFT JOIN company_tests ct ON ct.company_id = c.id AND ct.version = c.live_version
    WHERE c.slug = ${slug} LIMIT 1`;
  return row ?? null;
});

export type CandidateRow = {
  id: string;
  avatar_name: string;
  avatar_emoji: string;
  avatar_color: string;
  lang: Lang;
  status: Status;
  started_at: Date;
  finished_at: Date | null;
  answered: number;
  task_count: number; // of the version this candidate got
  total_ms: number; // finished_at - started_at, server timestamps (0 while in progress)
  limit_reached: boolean; // closed at the deadline
  invited: boolean; // has an interview code (the code itself never reaches the recruiter)
  code_verified: boolean; // the recruiter typed the right code in the last 30 minutes
  stage: Stage;
  contact: Contact | null; // only at stage full_interview (candidate consent)
};

// Recruiter queries read "invited" and "verified", never i.code itself.
const VERIFY_MINUTES = 30;

// Arrival order only (newest first). Deliberately no correctness or flag counts.
export async function listCandidates(testId: string): Promise<CandidateRow[]> {
  await closeExpiredForTest(testId);
  const rows = await db()<CandidateRow[]>`
    SELECT a.id, a.avatar_name, a.avatar_emoji, a.avatar_color, a.lang, a.status,
      a.started_at, a.finished_at,
      (SELECT count(*)::int FROM answers WHERE attempt_id = a.id) AS answered,
      coalesce((SELECT jsonb_array_length(tasks) FROM company_tests WHERE id = a.company_test_id),
        (SELECT count(*)::int FROM test_tasks WHERE test_id = a.test_id)) AS task_count,
      coalesce(extract(epoch from (a.finished_at - a.started_at)) * 1000, 0)::int AS total_ms,
      coalesce(a.finished_at >= a.started_at + make_interval(mins => a.time_limit_minutes), false) AS limit_reached,
      i.attempt_id IS NOT NULL AS invited,
      coalesce(i.code_verified_at > now() - make_interval(mins => ${VERIFY_MINUTES}), false) AS code_verified, a.stage, a.contact
    FROM attempts a LEFT JOIN invitations i ON i.attempt_id = a.id
    WHERE a.test_id = ${testId}::uuid
    ORDER BY a.started_at DESC`;
  return [...rows];
}

// A task of the attempt's own version (snapshot or older list) with the
// candidate's answer and the recruiter's note.
export type DetailTask = SimTask & {
  answered: boolean;
  answer: Answer;
  matches_key: boolean | null;
  time_ms: number | null;
  changes: number | null;
  flags: FlagCode[];
  asked: boolean;
  note: string;
};

export async function getCandidate(testId: string, attemptId: string) {
  if (!isUuid(attemptId)) return null;
  await closeExpiredForTest(testId);
  const sql = db();
  const [attempt] = await sql<(Omit<CandidateRow, "answered" | "task_count"> & { time_limit_minutes: number })[]>`
    SELECT a.id, a.avatar_name, a.avatar_emoji, a.avatar_color, a.lang, a.status, a.time_limit_minutes,
      a.started_at, a.finished_at,
      coalesce(extract(epoch from (a.finished_at - a.started_at)) * 1000, 0)::int AS total_ms,
      coalesce(a.finished_at >= a.started_at + make_interval(mins => a.time_limit_minutes), false) AS limit_reached,
      i.attempt_id IS NOT NULL AS invited,
      coalesce(i.code_verified_at > now() - make_interval(mins => ${VERIFY_MINUTES}), false) AS code_verified, a.stage, a.contact
    FROM attempts a LEFT JOIN invitations i ON i.attempt_id = a.id
    WHERE a.id = ${attemptId}::uuid AND a.test_id = ${testId}::uuid`;
  if (!attempt) return null;
  type AnswerRow = { task_id: string; answer: Answer; matches_key: boolean; time_ms: number; changes: number; flags: FlagCode[] };
  type NoteRow = { task_id: string; asked: boolean; note: string };
  const [tasks, answers, notes] = await Promise.all([
    attemptTasks(attemptId),
    sql<AnswerRow[]>`SELECT task_id, answer, matches_key, time_ms, changes, flags FROM answers WHERE attempt_id = ${attemptId}::uuid`,
    sql<NoteRow[]>`SELECT task_id, asked, note FROM recruiter_notes WHERE attempt_id = ${attemptId}::uuid`,
  ]);
  const detail: DetailTask[] = (tasks ?? []).map((t) => {
    const an = answers.find((r) => r.task_id === t.id);
    const rn = notes.find((r) => r.task_id === t.id);
    return {
      ...t,
      answered: Boolean(an),
      answer: an ? an.answer : null,
      matches_key: an ? an.matches_key : null,
      time_ms: an ? an.time_ms : null,
      changes: an ? an.changes : null,
      flags: an?.flags ?? [],
      asked: rn?.asked ?? false,
      note: rn?.note ?? "",
    };
  });
  return { attempt, tasks: detail };
}

// A human decision. "invited" also creates the interview code, which only the
// candidate's phone shows. Returns whether an invitation exists, never the code.
export async function setStatus(attemptId: string, status: Status): Promise<{ invited: boolean } | null> {
  if (!isUuid(attemptId)) return null;
  const sql = db();
  const rows = await sql`UPDATE attempts SET status = ${status} WHERE id = ${attemptId}::uuid RETURNING id`;
  if (!rows.length) return null;
  if (status === "invited") {
    // Unique within the company: on the rare clash, try another code.
    for (let i = 0; i < 8; i++) {
      const code = makeInviteCode();
      const added = await sql`
        INSERT INTO invitations (attempt_id, code)
        SELECT ${attemptId}::uuid, ${code}
        WHERE NOT EXISTS (
          SELECT 1 FROM invitations i JOIN attempts a ON a.id = i.attempt_id JOIN tests t ON t.id = a.test_id
          WHERE i.code = ${code} AND t.company_id = (
            SELECT t2.company_id FROM attempts a2 JOIN tests t2 ON t2.id = a2.test_id WHERE a2.id = ${attemptId}::uuid))
        ON CONFLICT (attempt_id) DO NOTHING
        RETURNING attempt_id`;
      if (added.length) break;
      const [has] = await sql`SELECT 1 FROM invitations WHERE attempt_id = ${attemptId}::uuid`;
      if (has) break;
    }
  }
  const [inv] = await sql`SELECT 1 FROM invitations WHERE attempt_id = ${attemptId}::uuid`;
  return { invited: Boolean(inv) };
}

// Wrong interview-code tries: at most 10 per minute per company.
const MISS_LIMIT = 10;

async function tooManyMisses(companyId: string): Promise<boolean> {
  const [{ n }] = await db()<{ n: number }[]>`
    SELECT count(*)::int AS n FROM code_misses WHERE company_id = ${companyId}::uuid AND at > now() - interval '1 minute'`;
  return n >= MISS_LIMIT;
}

async function recordMiss(companyId: string): Promise<void> {
  const sql = db();
  await sql`INSERT INTO code_misses (company_id) VALUES (${companyId}::uuid)`;
  await sql`DELETE FROM code_misses WHERE at < now() - interval '10 minutes'`;
}

export type CodeCheck = { ok: true; attemptId: string } | { ok: false; error: "wrong_code" | "rate_limited" };

// The recruiter types the code from the candidate's phone. A match within the
// company (from a candidate card: for that attempt only) marks it verified.
export async function verifyCode(companyId: string, code: string, attemptId: string | null = null): Promise<CodeCheck> {
  if (await tooManyMisses(companyId)) return { ok: false, error: "rate_limited" };
  const norm = normalizeInviteCode(code);
  const rows = isInviteCode(norm) && (attemptId === null || isUuid(attemptId))
    ? await db()<{ attempt_id: string }[]>`
        UPDATE invitations i SET code_verified_at = now()
        FROM attempts a JOIN tests t ON t.id = a.test_id
        WHERE a.id = i.attempt_id AND t.company_id = ${companyId}::uuid AND i.code = ${norm}
          AND (${attemptId}::uuid IS NULL OR a.id = ${attemptId}::uuid)
        RETURNING i.attempt_id`
    : [];
  if (rows.length === 1) return { ok: true, attemptId: rows[0].attempt_id };
  await recordMiss(companyId);
  return { ok: false, error: "wrong_code" };
}

// Mini-interview starts only from "anonymous" and only within 30 minutes of
// a verified code.
export async function startInterview(attemptId: string): Promise<"ok" | "not_verified" | "not_found"> {
  if (!isUuid(attemptId)) return "not_found";
  const sql = db();
  const rows = await sql`
    UPDATE attempts a SET stage = 'mini_interview', status = 'at_booth'
    FROM invitations i
    WHERE i.attempt_id = a.id AND a.id = ${attemptId}::uuid AND a.stage = 'anonymous'
      AND i.code_verified_at > now() - make_interval(mins => ${VERIFY_MINUTES})
    RETURNING a.id`;
  if (rows.length) return "ok";
  const [exists] = await sql`SELECT 1 FROM attempts WHERE id = ${attemptId}::uuid`;
  return exists ? "not_verified" : "not_found";
}

// Company of an attempt (for the per-company try limit).
export async function companyOfAttempt(attemptId: string): Promise<string | null> {
  if (!isUuid(attemptId)) return null;
  const [row] = await db()<{ id: string }[]>`
    SELECT t.company_id AS id FROM attempts a JOIN tests t ON t.id = a.test_id WHERE a.id = ${attemptId}::uuid`;
  return row?.id ?? null;
}

// Recruiter's next step after the mini-interview: request contact details,
// close ("Not this time"), or undo back to mini_interview. Allowed only until
// the candidate acts. Returns the stage now stored.
export async function setStage(attemptId: string, next: RecruiterStage): Promise<Stage | null> {
  if (!isUuid(attemptId)) return null;
  const sql = db();
  await sql`
    UPDATE attempts SET stage = ${next}
    WHERE id = ${attemptId}::uuid AND stage IN ('mini_interview', 'contact_requested', 'closed')`;
  const [row] = await sql<{ stage: Stage }[]>`SELECT stage FROM attempts WHERE id = ${attemptId}::uuid`;
  return row?.stage ?? null;
}

export async function saveNote(attemptId: string, taskId: string, asked: boolean, note: string): Promise<boolean> {
  if (!isUuid(attemptId) || !isUuid(taskId)) return false;
  // Only a task of the attempt's own version (task_id has no foreign key).
  if (!(await attemptTasks(attemptId))?.some((t) => t.id === taskId)) return false;
  const rows = await db()`
    INSERT INTO recruiter_notes (attempt_id, task_id, asked, note)
    SELECT ${attemptId}::uuid, ${taskId}::uuid, ${asked}, ${note.slice(0, 2000)}
    WHERE EXISTS (SELECT 1 FROM attempts WHERE id = ${attemptId}::uuid)
    ON CONFLICT (attempt_id, task_id) DO UPDATE SET asked = EXCLUDED.asked, note = EXCLUDED.note
    RETURNING attempt_id`;
  return rows.length > 0;
}

export type BoothCode = { code: string; taken: boolean };

// Booth codes for the codes screen: free ones first (newest batch first), then
// taken ones. "Taken" is all it says: never who used a code or when.
export async function listCodes(testId: string): Promise<{ free: number; taken: number; codes: BoothCode[] }> {
  const sql = db();
  const [[counts], rows] = await Promise.all([
    sql<{ free: number; taken: number }[]>`
      SELECT count(*) FILTER (WHERE status = 'new' AND expires_at > now())::int AS free,
        count(*) FILTER (WHERE status = 'activated')::int AS taken
      FROM qr_tokens WHERE test_id = ${testId}::uuid`,
    sql<BoothCode[]>`
      SELECT token AS code, status = 'activated' AS taken FROM qr_tokens
      WHERE test_id = ${testId}::uuid AND (status = 'activated' OR expires_at > now())
      ORDER BY status = 'activated', expires_at DESC, token
      LIMIT 300`,
  ]);
  return { free: counts.free, taken: counts.taken, codes: [...rows] };
}

export type StatRow = { status: Status; finished: boolean; this_week: boolean };

// For the Stats tab: one row per attempt, counted on the page. "This week"
// starts Monday 00:00 event time. Counts only, nothing per person.
export async function listStatRows(testId: string): Promise<StatRow[]> {
  await closeExpiredForTest(testId);
  const rows = await db()<StatRow[]>`
    SELECT status, finished_at IS NOT NULL AS finished,
      started_at >= (date_trunc('week', now() AT TIME ZONE 'Europe/Helsinki') AT TIME ZONE 'Europe/Helsinki') AS this_week
    FROM attempts WHERE test_id = ${testId}::uuid`;
  return [...rows];
}

// "Reset demo data" is offered only when DEMO_MODE is set (e.g. DEMO_MODE=1).
export const isDemoMode = () => /^(1|true|yes|on)$/i.test(process.env.DEMO_MODE ?? "");

// A print batch = the codes created by one "Create and print": one INSERT, so
// they share one expires_at (to the microsecond). Its id is that instant in
// microseconds since 1970, so batches need no extra table or column.
const BATCH_ID = /^\d{1,20}$/;

export async function batchOf(token: string): Promise<string | null> {
  const [row] = await db()<{ id: string }[]>`
    SELECT (extract(epoch from expires_at) * 1000000)::bigint::text AS id FROM qr_tokens WHERE token = ${token}`;
  return row?.id ?? null;
}

// The batch's codes, alphabetical. Taken ones are only marked as taken.
export async function listBatch(testId: string, batchId: string): Promise<BoothCode[] | null> {
  if (!BATCH_ID.test(batchId)) return null;
  const rows = await db()<BoothCode[]>`
    SELECT token AS code, status = 'activated' AS taken FROM qr_tokens
    WHERE test_id = ${testId}::uuid AND (extract(epoch from expires_at) * 1000000)::bigint = ${batchId}::bigint
    ORDER BY token`;
  return rows.length ? [...rows] : null;
}

export type BatchRow = { id: string; size: number; taken: number; created: Date };

// Recent print batches still valid, newest first. Single-code demo links are
// not batches and are left out.
export async function listBatches(testId: string, limit = 5): Promise<BatchRow[]> {
  const rows = await db()<BatchRow[]>`
    SELECT (extract(epoch from expires_at) * 1000000)::bigint::text AS id, count(*)::int AS size,
      count(*) FILTER (WHERE status = 'activated')::int AS taken,
      expires_at - ${PRINTED_CODE_DAYS}::int * interval '1 day' AS created
    FROM qr_tokens
    WHERE test_id = ${testId}::uuid AND expires_at > now()
    GROUP BY expires_at HAVING count(*) > 1
    ORDER BY expires_at DESC LIMIT ${limit}`;
  return [...rows];
}

// Ticket text for the company's printed booth tickets (companies.ticket).
export async function saveTicket(companyId: string, template: TicketTemplate): Promise<boolean> {
  const sql = db();
  const rows = await sql`UPDATE companies SET ticket = ${sql.json(template)} WHERE id = ${companyId}::uuid RETURNING id`;
  return rows.length > 0;
}
