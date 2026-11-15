import { randomUUID } from "node:crypto";
import { db } from "./db.ts";
import { isCodeShape, makeToken } from "./codes.ts";
import { makeAvatar } from "./avatar.ts";
import { computeFlags, type FlagCode } from "./flags.ts";
import type { Answer } from "./tasks.ts";
import { compareSim, isAnsweredSim, toPlayerTask, type PlayerTask } from "./sim.ts";
import { attemptTasks, DEFAULT_TIME_LIMIT } from "./sim-store.ts";
import type { Lang } from "./i18n.ts";
import type { Contact, Stage } from "./stage.ts";
import { closeIfExpired } from "./timing.ts";

// Data access for the candidate flow. Nothing here returns an answer key,
// a flag or a recruiter label to the candidate side.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (x: unknown): x is string => typeof x === "string" && UUID.test(x);

export type TokenView = {
  token: string;
  status: "new" | "activated";
  expired: boolean;
  attempt_id: string | null;
  owned: boolean; // the attempt belongs to the device asking
  started: boolean; // answers saved or finished
  avatar_name: string | null;
  avatar_emoji: string | null;
  avatar_color: string | null;
  company_name: string;
  booth: string;
  color: string;
  test_title: string;
  task_count: number;
  expected_sec: number;
  limit_minutes: number;
  english_required: boolean;
};

export async function getTokenView(token: string, ownerHash: string | null): Promise<TokenView | null> {
  const [row] = await db()<TokenView[]>`
    SELECT q.token, q.status, q.expires_at < now() AS expired, q.attempt_id,
      coalesce(a.owner_hash = ${ownerHash ?? ""}, false) AS owned,
      (a.finished_at IS NOT NULL OR EXISTS (SELECT 1 FROM answers WHERE attempt_id = a.id)) AS started,
      a.avatar_name, a.avatar_emoji, a.avatar_color,
      c.name AS company_name, c.booth, c.color, coalesce(ct.title, t.title) AS test_title,
      coalesce(jsonb_array_length(ct.tasks), (SELECT count(*)::int FROM test_tasks WHERE test_id = t.id)) AS task_count,
      coalesce((SELECT sum((x->>'expected_seconds')::int)::int FROM jsonb_array_elements(ct.tasks) x),
        (SELECT coalesce(sum(expected_sec), 0)::int FROM test_tasks WHERE test_id = t.id)) AS expected_sec,
      coalesce(a.time_limit_minutes, ct.time_limit_minutes, ${DEFAULT_TIME_LIMIT}) AS limit_minutes,
      coalesce(ct.english_required, false) AS english_required
    FROM qr_tokens q
    JOIN tests t ON t.id = q.test_id
    JOIN companies c ON c.id = t.company_id
    LEFT JOIN attempts a ON a.id = q.attempt_id
    -- The attempt's own version; before entry, the version it would get.
    LEFT JOIN company_tests ct ON ct.id = CASE WHEN a.id IS NULL
      THEN (SELECT id FROM company_tests WHERE test_id = t.id AND version = t.live_version)
      ELSE a.company_test_id END
    WHERE q.token = ${token}`;
  return row ?? null;
}

// Burn on entry: the first valid entry of a code creates the attempt and binds
// it to the entering device. One atomic statement, so a code can never start
// a second attempt. Avatar and language are chosen on the next screen. The
// attempt is pinned to the live version of the code's contest and its time
// limit (nothing published yet: the older task list and the default limit).
// A code of an Offline contest is not burned (/join says "paused").
export async function enterCode(code: string, ownerHash: string): Promise<string | null> {
  const id = randomUUID();
  const avatar = makeAvatar();
  const [row] = await db()<{ id: string }[]>`
    WITH tok AS (
      UPDATE qr_tokens SET status = 'activated', attempt_id = ${id}::uuid
      WHERE token = ${code} AND status = 'new' AND expires_at > now()
        AND test_id IN (SELECT id FROM tests WHERE NOT paused)
      RETURNING test_id
    ), live AS (
      SELECT ct.id, ct.time_limit_minutes FROM tok
      JOIN tests t ON t.id = tok.test_id
      JOIN company_tests ct ON ct.test_id = t.id AND ct.version = t.live_version
    )
    INSERT INTO attempts (id, test_id, avatar_name, avatar_emoji, avatar_color, owner_hash, company_test_id, time_limit_minutes)
    SELECT ${id}::uuid, tok.test_id, ${avatar.name}, ${avatar.emoji}, ${avatar.color}, ${ownerHash},
      live.id, coalesce(live.time_limit_minutes, ${DEFAULT_TIME_LIMIT})
    FROM tok LEFT JOIN live ON true
    RETURNING id`;
  return row?.id ?? null;
}

export async function ownsAttempt(attemptId: string, ownerHash: string | null): Promise<boolean> {
  if (!ownerHash || !isUuid(attemptId)) return false;
  const rows = await db()`SELECT 1 FROM attempts WHERE id = ${attemptId}::uuid AND owner_hash = ${ownerHash}`;
  return rows.length > 0;
}

// Start: UI language, and the clock starts now (started_at, server time) unless
// an answer is already saved. Owning device only, only before it finishes.
// The avatar stays the one assigned at entry.
export async function setupAttempt(token: string, ownerHash: string, lang: Lang): Promise<string | null> {
  const [row] = await db()<{ id: string }[]>`
    UPDATE attempts a SET lang = ${lang},
      started_at = CASE WHEN EXISTS (SELECT 1 FROM answers WHERE attempt_id = a.id) THEN a.started_at ELSE now() END
    FROM qr_tokens q
    WHERE q.token = ${token} AND a.id = q.attempt_id AND a.owner_hash = ${ownerHash} AND a.finished_at IS NULL
    RETURNING a.id`;
  return row?.id ?? null;
}

// Fresh single-use tokens for one contest of a company: one per demo QR link
// (1 day), or a batch of printed booth codes. testId null = the company's
// first contest that is not Offline. Returns the tokens actually created
// (none for an Offline contest).
export async function createTokens(slug: string, count: number, days: number, testId: string | null = null): Promise<string[]> {
  if (testId !== null && !isUuid(testId)) return [];
  const tokens = Array.from({ length: count }, makeToken);
  const rows = await db()<{ token: string }[]>`
    WITH t AS (
      SELECT t.id FROM tests t JOIN companies c ON c.id = t.company_id
      WHERE c.slug = ${slug} AND (${testId}::uuid IS NULL OR t.id = ${testId}::uuid) AND NOT t.paused
      ORDER BY t.created_at, t.id LIMIT 1
    )
    INSERT INTO qr_tokens (token, test_id, expires_at)
    SELECT tok, t.id, now() + ${days}::int * interval '1 day' FROM t, unnest(${tokens}::text[]) AS tok
    ON CONFLICT (token) DO NOTHING
    RETURNING token`;
  return rows.map((r) => r.token);
}

export async function createToken(slug: string): Promise<string | null> {
  const [token] = await createTokens(slug, 1, 1);
  return token ?? null;
}

// For /join: only says whether a typed code can start a test ("mine" = used,
// by this device). Never which company or candidate.
export async function checkCode(code: string, ownerHash: string | null): Promise<"ready" | "paused" | "used" | "mine" | "missing"> {
  if (!isCodeShape(code)) return "missing";
  const [row] = await db()<{ ready: boolean; paused: boolean; mine: boolean }[]>`
    SELECT q.status = 'new' AND q.expires_at > now() AS ready, t.paused,
      coalesce(a.owner_hash = ${ownerHash ?? ""}, false) AS mine
    FROM qr_tokens q JOIN tests t ON t.id = q.test_id LEFT JOIN attempts a ON a.id = q.attempt_id
    WHERE q.token = ${code}`;
  return !row ? "missing" : row.ready ? (row.paused ? "paused" : "ready") : row.mine ? "mine" : "used";
}

export type PlayerAttempt = {
  id: string;
  lang: Lang;
  finished: boolean;
  remaining_ms: number; // until the deadline, measured on the server
  avatar_name: string;
  avatar_emoji: string;
  avatar_color: string;
  company_name: string;
  booth: string;
  company_color: string;
};
export type { PlayerTask };
export type SavedAnswer = { task_id: string; answer: Answer; time_ms: number; changes: number };

export async function getPlayerData(attemptId: string) {
  if (!isUuid(attemptId)) return null;
  await closeIfExpired(attemptId);
  const sql = db();
  const [attempt] = await sql<PlayerAttempt[]>`
    SELECT a.id, a.lang, a.finished_at IS NOT NULL AS finished,
      greatest(0, extract(epoch from (a.started_at + make_interval(mins => a.time_limit_minutes) - now())) * 1000)::int AS remaining_ms,
      a.avatar_name, a.avatar_emoji, a.avatar_color,
      c.name AS company_name, c.booth, c.color AS company_color
    FROM attempts a JOIN tests t ON t.id = a.test_id JOIN companies c ON c.id = t.company_id
    WHERE a.id = ${attemptId}::uuid`;
  if (!attempt) return null;
  const [tasks, answers] = await Promise.all([
    attemptTasks(attemptId),
    sql<SavedAnswer[]>`SELECT task_id, answer, time_ms, changes FROM answers WHERE attempt_id = ${attemptId}::uuid`,
  ]);
  // Keys and the interview guide stay on the server.
  const playerTasks: PlayerTask[] = (tasks ?? []).map(toPlayerTask);
  return { attempt, tasks: playerTasks, answers: [...answers] };
}

export type SaveResult = "ok" | "not_found" | "finished" | "invalid";

export async function saveAnswer(
  attemptId: string,
  taskId: string,
  answer: Answer,
  timeMs: number,
  changes: number,
): Promise<SaveResult> {
  if (!isUuid(attemptId) || !isUuid(taskId)) return "not_found";
  const sql = db();
  const [ctx] = await sql<{ finished: boolean; expired: boolean }[]>`
    SELECT finished_at IS NOT NULL AS finished,
      now() > started_at + make_interval(mins => time_limit_minutes) AS expired
    FROM attempts WHERE id = ${attemptId}::uuid`;
  // Only a task of this attempt's own version counts.
  const task = ctx ? (await attemptTasks(attemptId))?.find((x) => x.id === taskId) : undefined;
  if (!ctx || !task) return "not_found";
  if (ctx.finished) return "finished";
  // Past the deadline: close the attempt and refuse the answer (409).
  if (ctx.expired) {
    await closeIfExpired(attemptId);
    return "finished";
  }
  const skipped = answer === null;
  if (!skipped && !isAnsweredSim(task.format, task.payload, answer)) return "invalid";

  const time = Math.max(0, Math.min(Math.round(timeMs), 2 * 60 * 60 * 1000));
  const changeCount = Math.max(0, Math.min(Math.round(changes), 99));
  const flags: FlagCode[] = computeFlags({ timeMs: time, expectedSec: task.expected_seconds, changes: changeCount, skipped });
  await sql`
    INSERT INTO answers (attempt_id, task_id, answer, matches_key, time_ms, changes, flags)
    VALUES (${attemptId}::uuid, ${taskId}::uuid, ${skipped ? null : sql.json(answer)},
      ${compareSim(task, answer)}, ${time}, ${changeCount}, ${sql.json(flags)})
    ON CONFLICT (attempt_id, task_id) DO UPDATE SET
      answer = EXCLUDED.answer, matches_key = EXCLUDED.matches_key, time_ms = EXCLUDED.time_ms,
      changes = EXCLUDED.changes, flags = EXCLUDED.flags`;
  return "ok";
}

// "Finish" before the deadline: finished_at = now. A late call still stops
// the clock at the deadline.
export async function finishAttempt(attemptId: string): Promise<boolean> {
  if (!isUuid(attemptId)) return false;
  const rows = await db()`
    UPDATE attempts SET finished_at = coalesce(finished_at, least(now(), started_at + make_interval(mins => time_limit_minutes)))
    WHERE id = ${attemptId}::uuid RETURNING id`;
  return rows.length > 0;
}

// What the candidate may know: whether time ran out, whether they are
// invited, and the code.
export async function getInvitationView(attemptId: string) {
  if (!isUuid(attemptId)) return null;
  await closeIfExpired(attemptId);
  const [row] = await db()<{ lang: Lang; booth: string; company_name: string; finished: boolean; limit_reached: boolean; code: string | null; stage: Stage }[]>`
    SELECT a.lang, c.booth, c.name AS company_name, a.finished_at IS NOT NULL AS finished, a.stage,
      coalesce(a.finished_at >= a.started_at + make_interval(mins => a.time_limit_minutes), false) AS limit_reached, i.code
    FROM attempts a
    JOIN tests t ON t.id = a.test_id JOIN companies c ON c.id = t.company_id
    LEFT JOIN invitations i ON i.attempt_id = a.id
    WHERE a.id = ${attemptId}::uuid`;
  return row ?? null;
}

// The candidate's answer to a contact request. Contact is stored only here,
// only with consent, and only while the request stands (stage moves to
// full_interview in the same UPDATE, as attempts_contact_check requires).
export async function submitContact(attemptId: string, contact: Contact): Promise<boolean> {
  if (!isUuid(attemptId)) return false;
  const sql = db();
  const rows = await sql`
    UPDATE attempts SET stage = 'full_interview',
      contact = ${sql.json({ ...contact, consented_at: new Date().toISOString() })}
    WHERE id = ${attemptId}::uuid AND stage = 'contact_requested'
    RETURNING id`;
  return rows.length > 0;
}

// "No thanks": nothing is stored.
export async function declineContact(attemptId: string): Promise<boolean> {
  if (!isUuid(attemptId)) return false;
  const rows = await db()`
    UPDATE attempts SET stage = 'contact_declined'
    WHERE id = ${attemptId}::uuid AND stage = 'contact_requested'
    RETURNING id`;
  return rows.length > 0;
}
