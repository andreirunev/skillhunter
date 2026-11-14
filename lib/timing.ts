import { db } from "./db.ts";

// Time limit per attempt (attempts.time_limit_minutes): copied from the
// contest's published version when the code is entered, default 20 minutes.

// Deadline = started_at + limit, enforced on the server by timestamps only
// (no tab, visibility or pause tracking). Nothing runs in the background, so
// an attempt past its deadline is closed the next time it is read or written:
// finished_at = the deadline itself, answers already saved are kept.

// Candidate side: this attempt (its owner is past Start).
export async function closeIfExpired(attemptId: string): Promise<void> {
  await db()`
    UPDATE attempts SET finished_at = started_at + make_interval(mins => time_limit_minutes)
    WHERE id = ${attemptId}::uuid AND finished_at IS NULL
      AND now() > started_at + make_interval(mins => time_limit_minutes)`;
}

// Recruiter side: every overdue attempt of the company's contests that has
// at least one answer. One with none may not have pressed Start yet, so it
// stays open.
export async function closeExpiredForCompany(companyId: string): Promise<void> {
  await db()`
    UPDATE attempts a SET finished_at = a.started_at + make_interval(mins => a.time_limit_minutes)
    WHERE a.test_id IN (SELECT id FROM tests WHERE company_id = ${companyId}::uuid) AND a.finished_at IS NULL
      AND now() > a.started_at + make_interval(mins => a.time_limit_minutes)
      AND EXISTS (SELECT 1 FROM answers WHERE attempt_id = a.id)`;
}
