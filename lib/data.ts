import { randomUUID } from "node:crypto";
import { db } from "./db.ts";
import { isCodeShape, makeToken } from "./codes.ts";
import { makeAvatar } from "./avatar.ts";
import { computeFlags, type FlagCode } from "./flags.ts";
import { isAnswered, matchesKey, type Answer, type AnswerKey, type TaskPayload, type TaskType } from "./tasks.ts";
import type { Lang } from "./i18n.ts";
import { closeIfExpired, TIME_LIMIT_MINUTES } from "./timing.ts";

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
};

export async function getTokenView(token: string, ownerHash: string | null): Promise<TokenView | null> {
  const [row] = await db()<TokenView[]>`
    SELECT q.token, q.status, q.expires_at < now() AS expired, q.attempt_id,
      coalesce(a.owner_hash = ${ownerHash ?? ""}, false) AS owned,
      (a.finished_at IS NOT NULL OR EXISTS (SELECT 1 FROM answers WHERE attempt_id = a.id)) AS started,
      a.avatar_name, a.avatar_emoji, a.avatar_color,
      c.name AS company_name, c.booth, c.color, t.title AS test_title,
      (SELECT count(*)::int FROM test_tasks WHERE test_id = t.id) AS task_count,
      (SELECT coalesce(sum(expected_sec), 0)::int FROM test_tasks WHERE test_id = t.id) AS expected_sec
    FROM qr_tokens q
    JOIN tests t ON t.id = q.test_id
    JOIN companies c ON c.id = t.company_id
    LEFT JOIN attempts a ON a.id = q.attempt_id
    WHERE q.token = ${token}`;
  return row ?? null;
}

// Burn on entry: the first valid entry of a code creates the attempt and binds
// it to the entering device. One atomic statement, so a code can never start
// a second attempt. Avatar and language are chosen on the next screen.
export async function enterCode(code: string, ownerHash: string): Promise<string | null> {
  const id = randomUUID();
  const avatar = makeAvatar();
  const [row] = await db()<{ id: string }[]>`
    WITH tok AS (
      UPDATE qr_tokens SET status = 'activated', attempt_id = ${id}::uuid
      WHERE token = ${code} AND status = 'new' AND expires_at > now()
      RETURNING test_id
    )
    INSERT INTO attempts (id, test_id, avatar_name, avatar_emoji, avatar_color, owner_hash)
    SELECT ${id}::uuid, test_id, ${avatar.name}, ${avatar.emoji}, ${avatar.color}, ${ownerHash} FROM tok
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

// Fresh single-use tokens for a company's test: one per demo QR link (1 day),
// or a batch of printed booth codes. Returns the tokens actually created.
export async function createTokens(slug: string, count: number, days: number): Promise<string[]> {
  const tokens = Array.from({ length: count }, makeToken);
  const rows = await db()<{ token: string }[]>`
    WITH t AS (
      SELECT t.id FROM tests t JOIN companies c ON c.id = t.company_id WHERE c.slug = ${slug} LIMIT 1
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
export async function checkCode(code: string, ownerHash: string | null): Promise<"ready" | "used" | "mine" | "missing"> {
  if (!isCodeShape(code)) return "missing";
  const [row] = await db()<{ ready: boolean; mine: boolean }[]>`
    SELECT q.status = 'new' AND q.expires_at > now() AS ready,
      coalesce(a.owner_hash = ${ownerHash ?? ""}, false) AS mine
    FROM qr_tokens q LEFT JOIN attempts a ON a.id = q.attempt_id
    WHERE q.token = ${code}`;
  return !row ? "missing" : row.ready ? "ready" : row.mine ? "mine" : "used";
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
export type PlayerTask = { id: string; type: TaskType; payload: TaskPayload };
export type SavedAnswer = { task_id: string; answer: Answer; time_ms: number; changes: number };

export async function getPlayerData(attemptId: string) {
  if (!isUuid(attemptId)) return null;
  await closeIfExpired(attemptId);
  const sql = db();
  const [attempt] = await sql<PlayerAttempt[]>`
    SELECT a.id, a.lang, a.finished_at IS NOT NULL AS finished,
      greatest(0, extract(epoch from (a.started_at + make_interval(mins => ${TIME_LIMIT_MINUTES}) - now())) * 1000)::int AS remaining_ms,
      a.avatar_name, a.avatar_emoji, a.avatar_color,
      c.name AS company_name, c.booth, c.color AS company_color
    FROM attempts a JOIN tests t ON t.id = a.test_id JOIN companies c ON c.id = t.company_id
    WHERE a.id = ${attemptId}::uuid`;
  if (!attempt) return null;
  const [tasks, answers] = await Promise.all([
    sql<PlayerTask[]>`
      SELECT tt.id, tt.type, tt.payload FROM test_tasks tt
      JOIN attempts a ON a.test_id = tt.test_id
      WHERE a.id = ${attemptId}::uuid ORDER BY tt.position`,
    sql<SavedAnswer[]>`SELECT task_id, answer, time_ms, changes FROM answers WHERE attempt_id = ${attemptId}::uuid`,
  ]);
  return { attempt, tasks: [...tasks], answers: [...answers] };
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
  const [ctx] = await sql<{ finished: boolean; expired: boolean; type: TaskType; payload: TaskPayload; answer_key: AnswerKey; expected_sec: number }[]>`
    SELECT a.finished_at IS NOT NULL AS finished,
      now() > a.started_at + make_interval(mins => ${TIME_LIMIT_MINUTES}) AS expired,
      tt.type, tt.payload, tt.answer_key, tt.expected_sec
    FROM attempts a JOIN test_tasks tt ON tt.test_id = a.test_id AND tt.id = ${taskId}::uuid
    WHERE a.id = ${attemptId}::uuid`;
  if (!ctx) return "not_found";
  if (ctx.finished) return "finished";
  // Past the deadline: close the attempt and refuse the answer (409).
  if (ctx.expired) {
    await closeIfExpired(attemptId);
    return "finished";
  }
  const skipped = answer === null;
  if (!skipped && !isAnswered(ctx.type, ctx.payload, answer)) return "invalid";

  const time = Math.max(0, Math.min(Math.round(timeMs), 2 * 60 * 60 * 1000));
  const changeCount = Math.max(0, Math.min(Math.round(changes), 99));
  const flags: FlagCode[] = computeFlags({ timeMs: time, expectedSec: ctx.expected_sec, changes: changeCount, skipped });
  await sql`
    INSERT INTO answers (attempt_id, task_id, answer, matches_key, time_ms, changes, flags)
    VALUES (${attemptId}::uuid, ${taskId}::uuid, ${skipped ? null : sql.json(answer)},
      ${matchesKey(ctx.type, answer, ctx.answer_key)}, ${time}, ${changeCount}, ${sql.json(flags)})
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
    UPDATE attempts SET finished_at = coalesce(finished_at, least(now(), started_at + make_interval(mins => ${TIME_LIMIT_MINUTES})))
    WHERE id = ${attemptId}::uuid RETURNING id`;
  return rows.length > 0;
}

// What the candidate may know: whether time ran out, whether they are
// invited, and the code.
export async function getInvitationView(attemptId: string) {
  if (!isUuid(attemptId)) return null;
  await closeIfExpired(attemptId);
  const [row] = await db()<{ lang: Lang; booth: string; company_name: string; finished: boolean; limit_reached: boolean; code: string | null }[]>`
    SELECT a.lang, c.booth, c.name AS company_name, a.finished_at IS NOT NULL AS finished,
      coalesce(a.finished_at >= a.started_at + make_interval(mins => ${TIME_LIMIT_MINUTES}), false) AS limit_reached, i.code
    FROM attempts a
    JOIN tests t ON t.id = a.test_id JOIN companies c ON c.id = t.company_id
    LEFT JOIN invitations i ON i.attempt_id = a.id
    WHERE a.id = ${attemptId}::uuid`;
  return row ?? null;
}
