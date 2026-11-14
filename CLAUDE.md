# SkillScan: project context (v3)

## 1. Event and challenge

- **Event:** Junction 2026 ("European Tech Renaissance"), Hype Areena, Espoo, 13-15 Nov 2026.
- **Deadlines (Helsinki time, which is 1 h behind Moscow):** final submission **Sun 15 Nov 10:00**; peer review Sun 10:30-14:00 (team must be present); top-5 pitches and winners Sun afternoon.
- **Challenge:** "Rethinking Recruitment" by City of Espoo (International Working Life Services and Business Services). Contact: Melissa Arni-Hardén.
- **Question:** How can Espoo recruitment and matchmaking events help companies and talent connect relevantly when AI-written CVs and AI screening are common?
- **Organiser-named problems:** companies can't describe needs; candidates can't show real skills; organisers can't judge capability; companies drown in irrelevant approaches; CVs are AI-written and AI-screened; online platforms are cumbersome; international recruitment is complex.
- **Organiser constraints:** no automated profiling or automated decisions about individuals without human involvement; no bias by nationality, language, education, career path; synthetic data only; minimal personal data; show how privacy is protected in real deployment (EU AI Act).
- **Judging:** Impact & Relevance 45%, Innovation & UX 35%, Responsible & Feasible Execution 20%. Self-estimate so far: ~77/100.
- **Prizes:** EUR 1500 / 1000 / 500, plus presentation to Espoo leaders.

## 2. Junction rules

- No code written before the event (we are at the event now; business logic is written on site). Team 1-4. MIT licence, public source link.
- Submission: name, punchline, description, challenge, technologies, **public pitch video max 2:00 (strict)**, demo link, source link, pitch deck PDF, phone numbers, Discord name. Set project to FINAL before Sun 10:00.
- Stage pitch: 3 min + 3 min questions, demo from own laptop.
- No hosting provided; the demo needs a public link.

## 3. Working context

- The user is a student on the team and writes to Claude in **Russian**. Answer in Russian. Submission text and project documents are in English.
- About 10 hours of build time. Priorities in this order: (1) mobile-first, simple and pretty, (2) the main flow works end to end, (3) responsible design is visible in the UI, (4) pitch.

## 4. Product: SkillScan

### Core idea
Candidates skip the CV. At a job fair they take a company brochure and a personal QR code from the recruiter, then complete short practical tasks under an anonymous avatar. The recruiter sees proof of skill instead of an AI-written CV. If interested, the recruiter invites the candidate to the booth and in a live conversation asks follow-up questions about each answer. The recruiter alone decides about an interview.

### Hard UX targets (most important)
- **Mobile-first.** Candidate flow is phone-only, one task per screen, big tap targets, no typing where possible. Recruiter screens must also work on a phone or tablet at a booth.
- **Simple and attractive.** Clean cards, one primary action per screen, friendly colours, no jargon.
- **Candidate total time <= 20 min, target ~10.** QR activation + avatar <= 1 min; 10-12 tasks of ~30-45 s each. The test builder shows a live time estimate and warns above ~12 min or 15 tasks.
- **Recruiter ease:** list of candidates, tap to open, see answers, timings, flags and suggested questions on one screen; one sticky action bar.

### Universality (key requirement)
The platform serves all sectors: cleaning, construction, welding, logistics, hospitality, healthcare support, IT. The constructor is **sector-agnostic, never IT-only**. Companies can either:
1. **Build their own tasks** from task formats (custom form), or
2. **Pick suggested sector packs** (cleaning, construction/welding, logistics, IT, general aptitude) and mix freely. "Use pack" creates a test in one tap.

Templates are grouped by sector and skill type (spatial, logical, procedural, attention to detail, safety awareness).

### Task formats (renderers)
`choice` (single answer, list or grid, optional emoji/image/code block), `multi` (select all that apply), `order` (tap items into sequence), `match` (tap pairs), `number` (short numeric answer with tolerance). Language-light: emoji, icons, short labels. Real photos/drawings are a production feature (companies upload their own).

### Flow
1. Booth contact: recruiter gives brochure + personal QR. Codes are pre-printed with a spare margin.
2. QR activation: random token, no personal data, single-use, expiry, bound to the company's test. No GPS or location.
3. Anonymous avatar (emoji + colour + generated nickname) and interface language (EN / FI / SV; no Russian UI). Task text stays English with emoji. Optional "own pace" mode (extra time).
4. Test: ~10-15 short tasks from the company's own mix.
5. Attempt saved: per task answer, time spent, number of answer changes.
6. **Informational flags** (plain rules, no ML), each with a short explanation and a "what this does NOT mean" note.
7. Recruiter review: sees answers, neutral facts, flags. Nothing is auto-sorted, scored or rejected.
8. Invitation: recruiter taps "Invite to booth"; the candidate's screen (polling) shows an invitation with a code/QR to show at the booth.
9. Live follow-up at the booth: for each answer the platform suggests questions (company-authored per task plus generic ones). Candidate explains verbally, in writing or by drawing (accessibility).
10. Human decision: the recruiter decides on an interview. Only a human decides about a person.
11. Contacts offline: the platform stores no contact data.
12. Deletion: all event data deleted after the event (a "delete all data" button exists). Demo uses synthetic data only. No IP addresses stored.

### What the system shows vs. what the human decides
- **System shows (neutral facts):** per task "matches company key" / "differs from key"; time per task and total versus the company's expected range; flags with explanations. **No overall score, no ranking, no automatic "good fit" label, no sorting by performance.**
- **Recruiter sets by button:** status labels such as *Good fit (my call)*, *Needs review*, *Invited*, *Interview offered*, *Not now*. These are human decisions, stored as such.
- Reason: a system-assigned label on a person is automated profiling, which the challenge forbids. A human-assigned label is fine.

### Flag rules (informational only)
- Task answered much faster than expected (e.g. under 15% of expected time).
- Task took much longer than expected (could be a break; no penalty).
- Answer changed 3+ times.
- Own-pace mode on: time flags are suppressed.
- No tab-switch tracking, no fraud score, no hidden signals, no penalty timers.

### Why this resists AI-assisted answers
The QR is booth-bound but the test can physically be done anywhere, and AI could be used. This is accepted openly: **the live follow-up per answer is the verification step**, and it is done by a human. Emphasise this in the demo and pitch.

### Likely judge questions and prepared answers
- *Why a test if the recruiter can ask the same questions at the booth?* Scale. The test filters noise before the conversation; at the booth the platform suggests what to ask.
- *Can candidates cheat with AI?* Possibly. That is why every answer is explained live to a human.
- *Bias in IQ-style items?* Real risk. Mitigations: tasks tied to what the role needs, language-light, extra-time option, no overall score, flags never lower anything, human reads answers.
- *Is this high-risk under the EU AI Act?* Do not claim "compliant". Say: we deliberately make no automated decisions; flags are simple rules without ML; the decision is human; data is minimal and deleted after the event.
- *Why would companies build tests?* Sector packs make it ~2 minutes; custom tasks are optional.
- *How is this different from HackerRank/Codility?* Any sector, offline fair with physical QR, company-built or pack tasks, live per-answer follow-up, no contact data on the platform.

### Value
- **Companies:** forced clarity on needs, less noise at the booth, evidence behind each conversation.
- **Candidates:** show ability without a polished CV; language-light; control over when they reveal themselves.
- **Espoo:** better matches, a repeatable fair format, privacy-friendly public-sector approach.

### Impact framing
State problem figures only as clearly labelled assumptions/estimates. Demo uses synthetic data.

## 5. Technical plan

### Stack (chosen)
- **Next.js 16 (App Router) + TypeScript + Tailwind v4 + Postgres (Supabase) via `postgres` (postgres.js) + qrcode.** Plain SQL, no ORM, no extra abstractions.
- **Deploy: Next.js on Vercel, Postgres on Supabase.** Nothing runs on boot (serverless).
- **One env var: `DATABASE_URL`** = Supabase *Transaction pooler* URI (port 6543). Locally in `.env.local` (gitignored; empty template in `.env.example`), in production in the Vercel project env vars. Never commit or print it.
- **Database scripts** (both read `DATABASE_URL` from `.env.local`): `npm run db:init` creates the tables (`CREATE TABLE IF NOT EXISTS`, safe to re-run); `npm run db:seed` seeds the demo data (re-runnable, no duplicates).
- Create the app: `npx create-next-app@latest skillscan --ts --tailwind --app --no-src-dir --eslint --import-alias "@/*" --use-npm --yes`, then `npm i postgres qrcode` and `npm i -D @types/qrcode`.

### Next.js 16 gotchas (this version differs from older docs)
- `AGENTS.md` says to read the bundled docs in `node_modules/next/dist/docs/` before coding. Do it for any API you're unsure about.
- The generated `next.config.ts` had `cacheComponents: true` and `partialPrefetching: true`. **Remove both** (the previous caching model is simpler for this app).
- The generated config also had a `turbopack.rules` entry for `@tailwindcss/turbopack`. If the build complains, use the standard Tailwind v4 setup with `@tailwindcss/postcss` and a `postcss.config.mjs`.
- `params` and `searchParams` in pages and route handlers are Promises: `await` them.
- Mark DB-reading pages and routes dynamic (`export const dynamic = "force-dynamic"`).
- Route handlers live in `app/api/**/route.ts`.
- DB access: `db()` in `lib/db.ts` returns the postgres.js client (`prepare: false` because the transaction pooler cannot keep prepared statements, small `max`, `ssl: "require"`). All data access functions are async.

### Data model (Postgres, schema in `lib/db.ts`)
Ids are `uuid` (`gen_random_uuid()`), except the QR token (`text`). Times are `timestamptz`. JSON fields are `jsonb`. RLS is enabled with no policies, so Supabase's public REST API cannot read the tables; the app connects as the table owner.
- `companies(id, slug, name, sector, booth, color)`
- `tests(id, company_id, title)`
- `test_tasks(id, test_id, position, type, payload jsonb, answer_key jsonb, expected_sec, skill, sector, follow_ups jsonb)`
- `qr_tokens(token, test_id, status new|activated, expires_at, attempt_id)`
- `attempts(id, test_id, avatar_name, avatar_emoji, avatar_color, lang, own_pace, started_at, finished_at, status new|invited|at_booth|good_fit|needs_review|interview|not_now)`
- `answers(attempt_id, task_id, answer jsonb, matches_key bool, time_ms, changes, flags jsonb)`
- `invitations(attempt_id, code, sent_at)`
- `recruiter_notes(attempt_id, task_id, asked bool, note)`
- The task library (sector packs) lives in code (`lib/library.ts`), copied into `test_tasks` when a company adds a task.

### Routes
- `/` demo launcher (pick a company as recruiter, or open a fresh candidate QR link).
- Candidate: `/c/[token]` (activate + avatar + language), `/t/[attemptId]` (task player), `/t/[attemptId]/done` (waiting + invitation).
- Recruiter (demo access by company slug; real deployment needs auth): `/r/[slug]` (candidate list), `/r/[slug]/a/[attemptId]` (detail + follow-ups + sticky actions), `/r/[slug]/test` (builder: sector packs + custom task form + live time estimate), `/r/[slug]/qr` (generate and print QR sheet), plus "delete all data".
- API: activate token, save answer, finish attempt, invitation (create/poll), status update, task CRUD, token generation, data deletion.

### Seed (synthetic)
4 companies (cleaning, construction/welding, logistics, IT), each with a test and ~8 synthetic candidates with varied answers and timings, so every dashboard looks alive. Deterministic random generator. Loaded with `npm run db:seed`.

### Build order (about 10 h)
1. h0-1: scaffold, config fixes, DB schema, seed, deploy empty skeleton.
2. h1-4: task renderers (5 types) + candidate flow.
3. h4-6: test builder with sector packs, custom tasks, time estimate.
4. h6-8: recruiter list, detail, flags, follow-ups, invitation, status buttons, QR sheet, delete data.
5. h8-10: polish on a real phone, seed data check, submission text, 2-min pitch script, one-slide flow, record video.
- **Cut if short on time:** drawing on screen, more than 3 UI languages, any analytics, `match` custom builder.
- Always keep the main flow demoable: QR -> avatar -> tasks -> recruiter sees answers/flags -> invite -> follow-up -> human status.

## 6. Open items
- Full English submission description (Problem, Solution, Demo flow, Responsible design, Impact).
- Final punchline (draft, under ~120 chars): "Show your skills, not your CV: solve real tasks at the job fair, then talk it through with a human."
- 2-minute pitch script and one-slide flow (QR -> test -> flags for humans -> live follow-up -> human decision).
- Confirm the challenge selection was submitted (draft due Fri 23:59).
- Judge Q&A rehearsal (section 4).

## 7. Guidance for Claude working on this project

- Respect the challenge rules: no automated decisions about people, synthetic data only, minimal personal data.
- Never add an overall score, ranking, automatic "good fit"/"reject" label, sorting by performance, behavioural surveillance, fraud score, GPS or tracking. Labels about a person are set by the recruiter only.
- Do not add contact collection to the platform. Do not store IP addresses.
- Keep the constructor sector-agnostic; examples and demo data cover several trades.
- Mobile-first always: design and test at ~390 px width first. Keep screens simple and visually clean.
- Candidate total time must stay under 20 min (target ~10).
- Reduce language and cultural barriers; judge the solution, not fluency.
- Be honest about weaknesses and risks (IQ-style bias, AI use during the test, high-risk AI Act context) and say so directly.
- Write submission text in English, clear and concise. Answer the user in Russian unless asked otherwise.
- Prefer working, demoable increments over completeness; ask before big scope changes.

---

Next.js agent rules (bundled docs for this exact version): @AGENTS.md
