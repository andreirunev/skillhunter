import postgres from "postgres";

// Plain SQL over postgres.js. The only setting is DATABASE_URL: the Supabase
// transaction pooler URI (port 6543), from .env.local or the Vercel env vars.

// Ids are uuids, times are timestamptz, structured fields are jsonb.
// Deliberately absent: IP addresses, location, device data. Names and contacts
// exist only in attempts.contact, typed by the candidate after a full-interview
// invitation (their consent), and are deleted with the event data.
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS companies (
  id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug   text NOT NULL UNIQUE,
  name   text NOT NULL,
  sector text NOT NULL,
  booth  text NOT NULL,
  color  text NOT NULL
);

-- Booth ticket text per company (lib/tickets.ts). NULL = the defaults.
ALTER TABLE companies ADD COLUMN IF NOT EXISTS ticket jsonb;

CREATE TABLE IF NOT EXISTS tests (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title      text NOT NULL
);

CREATE TABLE IF NOT EXISTS test_tasks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id      uuid NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  position     integer NOT NULL,
  type         text NOT NULL CHECK (type IN ('choice', 'multi', 'order', 'match', 'number')),
  payload      jsonb NOT NULL,
  answer_key   jsonb NOT NULL,
  expected_sec integer NOT NULL CHECK (expected_sec > 0),
  skill        text NOT NULL,
  sector       text NOT NULL,
  follow_ups   jsonb NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS attempts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id      uuid NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  avatar_name  text NOT NULL,
  avatar_emoji text NOT NULL,
  avatar_color text NOT NULL,
  lang         text NOT NULL DEFAULT 'en',
  own_pace     boolean NOT NULL DEFAULT false,
  started_at   timestamptz NOT NULL DEFAULT now(),
  finished_at  timestamptz,
  status       text NOT NULL DEFAULT 'new' CHECK (status IN
    ('new', 'invited', 'at_booth', 'good_fit', 'needs_review', 'interview', 'not_now', 'declined'))
);

-- UI languages: English, Finnish, Swedish. Re-created so re-running updates it.
ALTER TABLE attempts DROP CONSTRAINT IF EXISTS attempts_lang_check;
ALTER TABLE attempts ADD CONSTRAINT attempts_lang_check CHECK (lang IN ('en', 'fi', 'sv'));

-- Recruiter statuses (human labels). Re-created so re-running updates it.
ALTER TABLE attempts DROP CONSTRAINT IF EXISTS attempts_status_check, ADD CONSTRAINT attempts_status_check CHECK (status IN ('new','invited','at_booth','good_fit','needs_review','interview','not_now','declined'));

-- Booth flow, every step a human action: anonymous -> mini_interview (the
-- recruiter enters the candidate's code) -> contact_requested or closed (the
-- recruiter, reversible until the candidate acts) -> full_interview (the
-- candidate shared contact details with consent) or contact_declined.
ALTER TABLE attempts ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT 'anonymous', ADD COLUMN IF NOT EXISTS contact jsonb;
ALTER TABLE attempts DROP CONSTRAINT IF EXISTS attempts_stage_check, ADD CONSTRAINT attempts_stage_check CHECK (stage IN ('anonymous','mini_interview','contact_requested','full_interview','contact_declined','closed'));
ALTER TABLE attempts DROP CONSTRAINT IF EXISTS attempts_contact_check, ADD CONSTRAINT attempts_contact_check CHECK (contact IS NULL OR stage = 'full_interview');

-- Device binding: SHA-256 of the candidate's random device cookie. No device
-- info, no IP. NULL for seeded attempts (no candidate device can open them).
ALTER TABLE attempts ADD COLUMN IF NOT EXISTS owner_hash text;

CREATE TABLE IF NOT EXISTS qr_tokens (
  token      text PRIMARY KEY,
  test_id    uuid NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  status     text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'activated')),
  expires_at timestamptz NOT NULL,
  attempt_id uuid REFERENCES attempts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS answers (
  attempt_id  uuid NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  task_id     uuid NOT NULL REFERENCES test_tasks(id) ON DELETE CASCADE,
  answer      jsonb, -- NULL = skipped
  matches_key boolean NOT NULL,
  time_ms     integer NOT NULL,
  changes     integer NOT NULL DEFAULT 0,
  flags       jsonb NOT NULL DEFAULT '[]',
  PRIMARY KEY (attempt_id, task_id)
);

ALTER TABLE answers ALTER COLUMN answer DROP NOT NULL;

CREATE TABLE IF NOT EXISTS invitations (
  attempt_id uuid PRIMARY KEY REFERENCES attempts(id) ON DELETE CASCADE,
  code       text NOT NULL,
  sent_at    timestamptz NOT NULL DEFAULT now()
);

-- Interview code: 4 chars without look-alikes, shown only on the candidate's
-- phone, unique per company (checked by the app). Old "AB-12" codes get a
-- fresh one. code_verified_at = the recruiter typed it (valid 30 minutes).
UPDATE invitations SET code = (
  SELECT string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1), '')
  FROM generate_series(1, 4 + 0 * length(invitations.code)))
WHERE code !~ '^[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{4}$';
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS code_verified_at timestamptz;

-- Wrong interview-code tries per company, for the 10-per-minute limit.
-- Company and time only; pruned after 10 minutes.
CREATE TABLE IF NOT EXISTS code_misses (
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS code_misses_by_company ON code_misses (company_id, at);

CREATE TABLE IF NOT EXISTS recruiter_notes (
  attempt_id uuid NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  task_id    uuid NOT NULL REFERENCES test_tasks(id) ON DELETE CASCADE,
  asked      boolean NOT NULL DEFAULT false,
  note       text NOT NULL DEFAULT '',
  PRIMARY KEY (attempt_id, task_id)
);

-- Job simulation. A Head of HR describes the role's duties before the event;
-- each duty maps to one micro-task from task_library (seeded from
-- lib/sim-library.ts, starting points in role_templates). Publishing freezes
-- a full copy of the tasks in company_tests (one row per version of a
-- contest), so later edits never change an attempt in flight.
-- tests.live_version = the version new candidates get (0 = the older
-- test_tasks list); see "Contests" below.
CREATE TABLE IF NOT EXISTS task_library (
  id               text PRIMARY KEY,
  format           text NOT NULL CHECK (format IN ('triage','spot_error','next_step','apply_rule','read_decide','handover','quick_logic')),
  role_tags        text[] NOT NULL DEFAULT '{}',
  title            text NOT NULL,
  duty_hint        text NOT NULL,
  skill_tag        text NOT NULL,
  skill_kind       text NOT NULL CHECK (skill_kind IN ('hard', 'soft')),
  expected_seconds integer NOT NULL CHECK (expected_seconds > 0),
  payload          jsonb NOT NULL,
  key              jsonb,
  key_kind         text NOT NULL CHECK (key_kind IN ('exact', 'typical', 'none')),
  good_looks_like  text[] NOT NULL DEFAULT '{}',
  not_measure_note text NOT NULL,
  followups        text[] NOT NULL DEFAULT '{}',
  default_order    integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS role_templates (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug    text NOT NULL UNIQUE,
  name    text NOT NULL,
  summary text NOT NULL,
  duties  jsonb NOT NULL DEFAULT '[]'
);

ALTER TABLE companies ADD COLUMN IF NOT EXISTS live_version integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS company_tests (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id         uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  version            integer NOT NULL CHECK (version > 0),
  title              text NOT NULL,
  role_slug          text,
  duties             jsonb NOT NULL,
  tasks              jsonb NOT NULL,
  time_limit_minutes integer NOT NULL DEFAULT 20 CHECK (time_limit_minutes BETWEEN 5 AND 60),
  english_required   boolean NOT NULL DEFAULT false,
  published_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, version)
);

-- An attempt keeps the version (and time limit) it started with. NULL =
-- made before the simulation model: its tasks are the test_tasks rows.
ALTER TABLE attempts ADD COLUMN IF NOT EXISTS company_test_id uuid REFERENCES company_tests(id) ON DELETE CASCADE;
ALTER TABLE attempts ADD COLUMN IF NOT EXISTS time_limit_minutes integer NOT NULL DEFAULT 20;
CREATE INDEX IF NOT EXISTS attempts_by_company_test ON attempts (company_test_id);

-- Answers and notes may point at a snapshot task (a uuid inside
-- company_tests.tasks), so task_id no longer references test_tasks. Rows go
-- with their attempt (ON DELETE CASCADE on attempt_id).
ALTER TABLE answers DROP CONSTRAINT IF EXISTS answers_task_id_fkey;
ALTER TABLE recruiter_notes DROP CONSTRAINT IF EXISTS recruiter_notes_task_id_fkey;

-- Contests: a company may run several (one tests row each, e.g. a warehouse
-- and a cleaner contest). Each has its own published versions and its own
-- live version; booth codes and attempts already point at one tests row.
-- companies.live_version is no longer read (left for older deployments).
ALTER TABLE tests ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE tests ADD COLUMN IF NOT EXISTS live_version integer NOT NULL DEFAULT 0;
ALTER TABLE company_tests ADD COLUMN IF NOT EXISTS test_id uuid REFERENCES tests(id) ON DELETE CASCADE;
-- Versions published while a company had one contest belong to that contest.
UPDATE company_tests ct SET test_id = (
  SELECT t.id FROM tests t WHERE t.company_id = ct.company_id ORDER BY t.created_at, t.id LIMIT 1)
WHERE ct.test_id IS NULL;
UPDATE tests t SET live_version = (SELECT max(version) FROM company_tests ct WHERE ct.test_id = t.id)
WHERE t.live_version = 0 AND EXISTS (SELECT 1 FROM company_tests ct WHERE ct.test_id = t.id);
ALTER TABLE company_tests DROP CONSTRAINT IF EXISTS company_tests_company_id_version_key;
CREATE UNIQUE INDEX IF NOT EXISTS company_tests_by_test_version ON company_tests (test_id, version);
CREATE INDEX IF NOT EXISTS tests_by_company ON tests (company_id, created_at);

CREATE INDEX IF NOT EXISTS test_tasks_by_test ON test_tasks (test_id, position);
CREATE INDEX IF NOT EXISTS attempts_by_test ON attempts (test_id, started_at);
CREATE INDEX IF NOT EXISTS qr_tokens_by_test ON qr_tokens (test_id);

-- Supabase also serves the public schema over its REST API. RLS without
-- policies closes that door; this app connects as the table owner, which RLS
-- does not restrict.
ALTER TABLE companies       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests           ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_tasks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_tokens       ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_misses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_library    ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_templates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_tests   ENABLE ROW LEVEL SECURITY;
`;

// One small pool per server process, kept on globalThis so dev reloads reuse it.
const globalForDb = globalThis as unknown as { __skillscanSql?: postgres.Sql };

export function db(): postgres.Sql {
  if (!globalForDb.__skillscanSql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set: copy .env.example to .env.local and fill it in.");
    globalForDb.__skillscanSql = postgres(url, {
      prepare: false, // the transaction pooler cannot keep prepared statements
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: "require",
    });
  }
  return globalForDb.__skillscanSql;
}

export type Company = {
  id: string;
  slug: string;
  name: string;
  sector: string;
  booth: string;
  color: string;
};

export async function listCompanies() {
  return db()<(Company & { test_title: string | null })[]>`
    SELECT c.*, t.title AS test_title
    FROM companies c
    LEFT JOIN tests t ON t.company_id = c.id
    ORDER BY c.booth`;
}
