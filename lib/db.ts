import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { seed } from "./seed";

export type Db = Database.Database;

// Bump when the schema changes: the local file is then dropped and re-seeded.
// Safe because the database only ever holds synthetic demo data.
const SCHEMA_VERSION = 1;

// Drop order matters: children before parents (foreign keys are on).
const TABLES = [
  "recruiter_notes",
  "invitations",
  "answers",
  "qr_tokens",
  "attempts",
  "test_tasks",
  "tests",
  "companies",
];

// Times are epoch milliseconds. JSON columns are stored as TEXT.
// Deliberately absent: names, contacts, IP addresses, location, device data.
const SCHEMA = `
CREATE TABLE companies (
  id     INTEGER PRIMARY KEY,
  slug   TEXT NOT NULL UNIQUE,
  name   TEXT NOT NULL,
  sector TEXT NOT NULL,
  booth  TEXT NOT NULL,
  color  TEXT NOT NULL
);

CREATE TABLE tests (
  id         INTEGER PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title      TEXT NOT NULL
);

CREATE TABLE test_tasks (
  id           INTEGER PRIMARY KEY,
  test_id      INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  position     INTEGER NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('choice', 'multi', 'order', 'match', 'number')),
  payload      TEXT NOT NULL,
  answer_key   TEXT NOT NULL,
  expected_sec INTEGER NOT NULL,
  skill        TEXT NOT NULL,
  sector       TEXT NOT NULL,
  follow_ups   TEXT NOT NULL
);

CREATE TABLE attempts (
  id           TEXT PRIMARY KEY,
  test_id      INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  avatar_name  TEXT NOT NULL,
  avatar_emoji TEXT NOT NULL,
  avatar_color TEXT NOT NULL,
  lang         TEXT NOT NULL DEFAULT 'en' CHECK (lang IN ('en', 'fi', 'ru')),
  own_pace     INTEGER NOT NULL DEFAULT 0,
  started_at   INTEGER NOT NULL,
  finished_at  INTEGER,
  status       TEXT NOT NULL DEFAULT 'new' CHECK (status IN
    ('new', 'invited', 'at_booth', 'good_fit', 'needs_review', 'interview', 'not_now'))
);

CREATE TABLE qr_tokens (
  token      TEXT PRIMARY KEY,
  test_id    INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'activated')),
  expires_at INTEGER NOT NULL,
  attempt_id TEXT REFERENCES attempts(id) ON DELETE SET NULL
);

CREATE TABLE answers (
  attempt_id  TEXT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  task_id     INTEGER NOT NULL REFERENCES test_tasks(id) ON DELETE CASCADE,
  answer      TEXT NOT NULL,
  matches_key INTEGER NOT NULL,
  time_ms     INTEGER NOT NULL,
  changes     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (attempt_id, task_id)
);

CREATE TABLE invitations (
  attempt_id TEXT PRIMARY KEY REFERENCES attempts(id) ON DELETE CASCADE,
  code       TEXT NOT NULL,
  sent_at    INTEGER NOT NULL
);

CREATE TABLE recruiter_notes (
  attempt_id TEXT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  task_id    INTEGER NOT NULL REFERENCES test_tasks(id) ON DELETE CASCADE,
  asked      INTEGER NOT NULL DEFAULT 0,
  note       TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (attempt_id, task_id)
);

CREATE INDEX test_tasks_by_test ON test_tasks(test_id, position);
CREATE INDEX attempts_by_test ON attempts(test_id, started_at);
CREATE INDEX qr_tokens_by_test ON qr_tokens(test_id);
`;

// One connection per server process. Kept on globalThis because Next.js can
// evaluate this module more than once (dev reloads, separate server layers).
const globalForDb = globalThis as unknown as { __skillscanDb?: Db };

export function getDb(): Db {
  globalForDb.__skillscanDb ??= open();
  return globalForDb.__skillscanDb;
}

function open(): Db {
  const file = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "skillscan.db");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file, { timeout: 5000 });
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  // IMMEDIATE takes the write lock up front, so two processes booting at once
  // cannot both see an empty database and seed it twice.
  db.transaction(() => {
    if (db.pragma("user_version", { simple: true }) !== SCHEMA_VERSION) {
      for (const table of TABLES) db.exec(`DROP TABLE IF EXISTS ${table}`);
      db.exec(SCHEMA);
      db.pragma(`user_version = ${SCHEMA_VERSION}`);
    }
    const { n } = db.prepare("SELECT COUNT(*) AS n FROM companies").get() as { n: number };
    if (n === 0) seed(db);
  }).immediate();
  return db;
}
