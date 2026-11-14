import { db } from "./db.ts";

// Fixed test time limit. One value for every company for now; the test
// builder will set it per company later (no column yet).
export const TIME_LIMIT_MINUTES = 20;

// Deadline = started_at + limit, enforced on the server by timestamps only
// (no tab, visibility or pause tracking). Nothing runs in the background, so
// an attempt past its deadline is closed the next time it is read or written:
// finished_at = the deadline itself, answers already saved are kept.

// Candidate side: this attempt (its owner is past Start).
export async function closeIfExpired(attemptId: string): Promise<void> {
  await db()`
    UPDATE attempts SET finished_at = started_at + make_interval(mins => ${TIME_LIMIT_MINUTES})
    WHERE id = ${attemptId}::uuid AND finished_at IS NULL
      AND now() > started_at + make_interval(mins => ${TIME_LIMIT_MINUTES})`;
}

// Recruiter side: every overdue attempt of a test that has at least one
// answer. One with none may not have pressed Start yet, so it stays open.
export async function closeExpiredForTest(testId: string): Promise<void> {
  await db()`
    UPDATE attempts a SET finished_at = a.started_at + make_interval(mins => ${TIME_LIMIT_MINUTES})
    WHERE a.test_id = ${testId}::uuid AND a.finished_at IS NULL
      AND now() > a.started_at + make_interval(mins => ${TIME_LIMIT_MINUTES})
      AND EXISTS (SELECT 1 FROM answers WHERE attempt_id = a.id)`;
}
