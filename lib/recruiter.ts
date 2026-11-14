import { cache } from "react";
import { db } from "./db.ts";
import { isUuid } from "./data.ts";
import { makeInviteCode, PRINTED_CODE_DAYS } from "./codes.ts";
import type { FlagCode } from "./flags.ts";
import type { Answer, AnswerKey, Skill, TaskPayload, TaskType } from "./tasks.ts";
import type { Lang } from "./i18n.ts";
import type { TicketTemplate } from "./tickets.ts";
import { closeExpiredForTest, TIME_LIMIT_MINUTES } from "./timing.ts";

// Recruiter-side data. Demo access is by company slug; a real deployment puts
// staff login in front of this. Nothing here scores, ranks or sorts by results.

export const STATUSES = ["new", "invited", "at_booth", "good_fit", "needs_review", "interview", "not_now", "declined"] as const;
export type Status = (typeof STATUSES)[number];
export const isStatus = (x: unknown): x is Status => typeof x === "string" && (STATUSES as readonly string[]).includes(x);

export type Company = { id: string; slug: string; name: string; sector: string; booth: string; color: string; ticket: unknown; test_id: string; test_title: string; task_count: number; expected_sec: number };

// Cached per request: the recruiter layout and its page both read it.
export const getCompany = cache(async (slug: string): Promise<Company | null> => {
  const [row] = await db()<Company[]>`
    SELECT c.id, c.slug, c.name, c.sector, c.booth, c.color, c.ticket, t.id AS test_id, t.title AS test_title,
      (SELECT count(*)::int FROM test_tasks WHERE test_id = t.id) AS task_count,
      (SELECT coalesce(sum(expected_sec), 0)::int FROM test_tasks WHERE test_id = t.id) AS expected_sec
    FROM companies c JOIN tests t ON t.company_id = c.id
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
  total_ms: number; // finished_at - started_at, server timestamps (0 while in progress)
  limit_reached: boolean; // closed at the deadline
  invite_code: string | null;
};

// Arrival order only (newest first). Deliberately no correctness or flag counts.
export async function listCandidates(testId: string): Promise<CandidateRow[]> {
  await closeExpiredForTest(testId);
  const rows = await db()<CandidateRow[]>`
    SELECT a.id, a.avatar_name, a.avatar_emoji, a.avatar_color, a.lang, a.status,
      a.started_at, a.finished_at,
      (SELECT count(*)::int FROM answers WHERE attempt_id = a.id) AS answered,
      coalesce(extract(epoch from (a.finished_at - a.started_at)) * 1000, 0)::int AS total_ms,
      coalesce(a.finished_at >= a.started_at + make_interval(mins => ${TIME_LIMIT_MINUTES}), false) AS limit_reached,
      i.code AS invite_code
    FROM attempts a LEFT JOIN invitations i ON i.attempt_id = a.id
    WHERE a.test_id = ${testId}::uuid
    ORDER BY a.started_at DESC`;
  return [...rows];
}

export type DetailTask = {
  id: string;
  position: number;
  type: TaskType;
  payload: TaskPayload;
  answer_key: AnswerKey;
  expected_sec: number;
  skill: Skill;
  follow_ups: string[];
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
  const [attempt] = await sql<(Omit<CandidateRow, "answered">)[]>`
    SELECT a.id, a.avatar_name, a.avatar_emoji, a.avatar_color, a.lang, a.status,
      a.started_at, a.finished_at,
      coalesce(extract(epoch from (a.finished_at - a.started_at)) * 1000, 0)::int AS total_ms,
      coalesce(a.finished_at >= a.started_at + make_interval(mins => ${TIME_LIMIT_MINUTES}), false) AS limit_reached,
      i.code AS invite_code
    FROM attempts a LEFT JOIN invitations i ON i.attempt_id = a.id
    WHERE a.id = ${attemptId}::uuid AND a.test_id = ${testId}::uuid`;
  if (!attempt) return null;
  const tasks = await sql<DetailTask[]>`
    SELECT tt.id, tt.position, tt.type, tt.payload, tt.answer_key, tt.expected_sec, tt.skill, tt.follow_ups,
      an.task_id IS NOT NULL AS answered, an.answer, an.matches_key, an.time_ms, an.changes,
      coalesce(an.flags, '[]'::jsonb) AS flags,
      coalesce(rn.asked, false) AS asked, coalesce(rn.note, '') AS note
    FROM test_tasks tt
    LEFT JOIN answers an ON an.task_id = tt.id AND an.attempt_id = ${attemptId}::uuid
    LEFT JOIN recruiter_notes rn ON rn.task_id = tt.id AND rn.attempt_id = ${attemptId}::uuid
    WHERE tt.test_id = ${testId}::uuid
    ORDER BY tt.position`;
  return { attempt, tasks: [...tasks] };
}

// A human decision. "invited" also creates the booth code the candidate sees.
export async function setStatus(attemptId: string, status: Status): Promise<{ code: string | null } | null> {
  if (!isUuid(attemptId)) return null;
  const sql = db();
  const rows = await sql`UPDATE attempts SET status = ${status} WHERE id = ${attemptId}::uuid RETURNING id`;
  if (!rows.length) return null;
  if (status === "invited") {
    await sql`
      INSERT INTO invitations (attempt_id, code) VALUES (${attemptId}::uuid, ${makeInviteCode()})
      ON CONFLICT (attempt_id) DO NOTHING`;
  }
  const [inv] = await sql<{ code: string }[]>`SELECT code FROM invitations WHERE attempt_id = ${attemptId}::uuid`;
  return { code: inv?.code ?? null };
}

export async function saveNote(attemptId: string, taskId: string, asked: boolean, note: string): Promise<boolean> {
  if (!isUuid(attemptId) || !isUuid(taskId)) return false;
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
