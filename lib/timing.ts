import { db } from "./db.ts";

// Time limit per attempt (attempts.time_limit_minutes): copied from the
// contest's published version when the code is entered, default 20 minutes.

// The limit is soft: the candidate sees a countdown, then how far over it
// they are, and can still answer and submit. Only an attempt left open for
// CLOSE_AFTER_LIMITS times the limit is closed (a hard cap, so abandoned
// attempts end), enforced on the server by timestamps only (no tab,
// visibility or pause tracking). Nothing runs in the background, so an
// attempt past the cap is closed the next time it is read or written:
// finished_at = the cap itself, answers already saved are kept.
export const CLOSE_AFTER_LIMITS = 2;

// Candidate side: this attempt (its owner is past Start).
export async function closeIfExpired(attemptId: string): Promise<void> {
  await db()`
    UPDATE attempts SET finished_at = started_at + make_interval(mins => time_limit_minutes * ${CLOSE_AFTER_LIMITS}::int)
    WHERE id = ${attemptId}::uuid AND finished_at IS NULL
      AND now() > started_at + make_interval(mins => time_limit_minutes * ${CLOSE_AFTER_LIMITS}::int)`;
}

// Recruiter side: every attempt of the company's contests past the cap that
// has at least one answer. One with none may not have pressed Start yet, so
// it stays open.
export async function closeExpiredForCompany(companyId: string): Promise<void> {
  await db()`
    UPDATE attempts a SET finished_at = a.started_at + make_interval(mins => a.time_limit_minutes * ${CLOSE_AFTER_LIMITS}::int)
    WHERE a.test_id IN (SELECT id FROM tests WHERE company_id = ${companyId}::uuid) AND a.finished_at IS NULL
      AND now() > a.started_at + make_interval(mins => a.time_limit_minutes * ${CLOSE_AFTER_LIMITS}::int)
      AND EXISTS (SELECT 1 FROM answers WHERE attempt_id = a.id)`;
}
