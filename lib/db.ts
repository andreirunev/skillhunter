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

-- Stage only moves forward: anonymous -> mini_interview (booth code entered)
-- -> full_interview. Contact is optional, typed by the candidate, and only
-- allowed once a full interview is offered.
ALTER TABLE attempts ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT 'anonymous', ADD COLUMN IF NOT EXISTS contact jsonb;
ALTER TABLE attempts DROP CONSTRAINT IF EXISTS attempts_stage_check, ADD CONSTRAINT attempts_stage_check CHECK (stage IN ('anonymous','mini_interview','full_interview'));
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

CREATE TABLE IF NOT EXISTS recruiter_notes (
  attempt_id uuid NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  task_id    uuid NOT NULL REFERENCES test_tasks(id) ON DELETE CASCADE,
  asked      boolean NOT NULL DEFAULT false,
  note       text NOT NULL DEFAULT '',
  PRIMARY KEY (attempt_id, task_id)
);

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
