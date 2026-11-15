# SkillHunter

Show your skills, not your CV. At a job fair a candidate gets a single-use booth code, solves short job-simulation tasks under an anonymous avatar, and the recruiter sees the answers (not a score) before inviting them to a live follow-up at the booth. A human makes every decision.

Built at Junction 2026 for the City of Espoo challenge "Rethinking Recruitment". Demo data is synthetic.

## Responsible design

- No overall score, ranking, sorting by results or automatic labels. Status labels are set by the recruiter.
- Flags are three plain rules (very fast, took much longer, answer changed 3+ times), shown with an explanation. They never lower anything.
- Candidates are anonymous (avatar + single-use code). No CV, IP address, location or tab tracking.
- Contact details are stored only after a full-interview request and the candidate's explicit consent.

## Stack

Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Postgres (Supabase) via `postgres` (plain SQL) + `qrcode`. Deployed on Vercel.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL
npm run db:init              # create tables (safe to re-run)
npm run db:seed              # seed demo companies, contests and candidates
npm run dev                  # http://localhost:3000
```

Environment variables:

- `DATABASE_URL`: Supabase transaction pooler URI (port 6543). Never commit it.
- `DEMO_MODE` (optional): set to `1` to show "Reset demo data" on the Contests tab.

`npm run db:reseed` wipes demo attempts, codes and published versions, then seeds again.

## Demo

- `/`: landing with a booth-code box (candidate) and a PIN box (recruiter).
- `/join`: enter a booth code. `/demo/<slug>` issues a fresh code for this device (e.g. `/demo/kulku`).
- `/r`: recruiter sign-in. The demo PIN is the company slug (`kirkas`, `silta`, `kulku`, `pilvi`, `leikki`).
- `/r/<slug>`: candidates, booth codes, stats and contests (test builder).

## Known demo limitations

- Recruiter screens and recruiter API routes are not login-protected: anyone with the link can open them. A real deployment needs staff accounts.
- The demo PIN is the company slug.

## Licence

MIT, see `LICENSE`.
