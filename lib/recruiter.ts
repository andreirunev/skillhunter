import { db } from "./db.ts";
import { isUuid } from "./data.ts";
import { makeInviteCode } from "./codes.ts";
import type { FlagCode } from "./flags.ts";
import type { Answer, AnswerKey, Skill, TaskPayload, TaskType } from "./tasks.ts";
import type { Lang } from "./i18n.ts";

// Recruiter-side data. Demo access is by company slug; a real deployment puts
// staff login in front of this. Nothing here scores, ranks or sorts by results.

export const STATUSES = ["new", "invited", "at_booth", "good_fit", "needs_review", "interview", "not_now"] as const;
export type Status = (typeof STATUSES)[number];
export const isStatus = (x: unknown): x is Status => typeof x === "string" && (STATUSES as readonly string[]).includes(x);

export type Company = { id: string; slug: string; name: string; sector: string; booth: string; color: string; test_id: string; test_title: string; task_count: number; expected_sec: number };

export async function getCompany(slug: string): Promise<Company | null> {
  const [row] = await db()<Company[]>`
    SELECT c.id, c.slug, c.name, c.sector, c.booth, c.color, t.id AS test_id, t.title AS test_title,
      (SELECT count(*)::int FROM test_tasks WHERE test_id = t.id) AS task_count,
      (SELECT coalesce(sum(expected_sec), 0)::int FROM test_tasks WHERE test_id = t.id) AS expected_sec
    FROM companies c JOIN tests t ON t.company_id = c.id
    WHERE c.slug = ${slug} LIMIT 1`;
  return row ?? null;
}

export type CandidateRow = {
  id: string;
  avatar_name: string;
  avatar_emoji: string;
  avatar_color: string;
  lang: Lang;
  own_pace: boolean;
  status: Status;
  started_at: Date;
  finished_at: Date | null;
  answered: number;
  total_ms: number;
  invite_code: string | null;
};

// Arrival order only (newest first). Deliberately no correctness or flag counts.
export async function listCandidates(testId: string): Promise<CandidateRow[]> {
  const rows = await db()<CandidateRow[]>`
    SELECT a.id, a.avatar_name, a.avatar_emoji, a.avatar_color, a.lang, a.own_pace, a.status,
      a.started_at, a.finished_at,
      (SELECT count(*)::int FROM answers WHERE attempt_id = a.id) AS answered,
      (SELECT coalesce(sum(time_ms), 0)::int FROM answers WHERE attempt_id = a.id) AS total_ms,
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
  const sql = db();
  const [attempt] = await sql<(Omit<CandidateRow, "answered" | "total_ms">)[]>`
    SELECT a.id, a.avatar_name, a.avatar_emoji, a.avatar_color, a.lang, a.own_pace, a.status,
      a.started_at, a.finished_at, i.code AS invite_code
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
