import type { Viewport } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FormatChip, KindChip, ListenFor, NotMeasure } from "@/components/GuideParts";
import { joinSep } from "@/components/ui/Sep";
import { getCompany } from "@/lib/recruiter";
import { getLiveTest, legacyTasks } from "@/lib/sim-store";
import { GENERIC_FOLLOW_UPS } from "@/lib/tasks";
import { SKIN_THEME_COLOR } from "@/lib/theme";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";

export const viewport: Viewport = { themeColor: SKIN_THEME_COLOR };

const LABEL = "text-[11px] font-semibold uppercase tracking-[0.08em] text-muted";

// A4 on this page only (the ticket print view sets its own page box).
const PAGE_CSS = "@page { size: A4; margin: 12mm; }";

// Booth sheet for the staff who run the first conversation: every task of the
// live test with its follow-up questions, what to listen for and what it
// does NOT mean. No answer keys and no candidate data, since paper lies
// around at a booth. Prints black on white (globals.css, .guide-root).
export default async function GuidePage(props: PageProps<"/r/[slug]/guide">) {
  const { slug } = await props.params;
  const company = await getCompany(slug);
  if (!company) notFound();
  const live = await getLiveTest(company.id);
  const tasks = live?.tasks ?? (await legacyTasks(company.test_id));
  const minutes = Math.max(1, Math.round(tasks.reduce((s, t) => s + t.expected_seconds, 0) / 60));

  return (
    <div data-skin className="guide-root flex min-h-dvh flex-1 flex-col">
      <style>{PAGE_CSS}</style>
      <div className="guide-screen sticky top-0 z-10 border-b border-border bg-bg">
        <div className="mx-auto flex max-w-[720px] items-center gap-3 px-4 py-2">
          <Link href={`/r/${slug}/about`} className="ui-btn ui-btn-secondary">Back</Link>
          <p className="min-w-0 flex-1 truncate text-[13px] text-muted">One sheet per booth. No answer keys, no candidate data.</p>
          <PrintButton />
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-[720px] flex-col gap-4 px-4 pb-12 pt-5">
        <header className="flex flex-col gap-1">
          <p className={LABEL}>{joinSep([company.name, `Booth ${company.booth}`])}</p>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight">Interview guide</h1>
          <p className="text-base font-semibold">{company.test_title}</p>
          <p className="text-[13px] text-muted">
            {joinSep([
              live ? `Version ${live.version}` : "Older task list",
              `${tasks.length} tasks`,
              `≈ ${minutes} min`,
              `limit ${company.time_limit_minutes} min`,
              live?.english_required ? "English needed in the job" : null,
            ])}
          </p>
        </header>

        <section className="guide-task border border-border bg-card p-3 text-sm">
          <p className={LABEL}>At the booth</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            <li>Ask the candidate to explain each answer in their own words. Speaking, writing or drawing are all fine.</li>
            <li>There is no score. &quot;Typical answer&quot; is a guide for the talk, not a right answer.</li>
            <li>Soft skills are a signal for conversation only, never a rating.</li>
            <li>You decide the next step. Contact details only with the candidate&apos;s consent.</li>
          </ul>
        </section>

        {tasks.map((t, i) => {
          const questions = t.library_id === "legacy" ? [...t.followups, ...GENERIC_FOLLOW_UPS] : t.followups;
          return (
            <article key={t.id} className="guide-task flex flex-col gap-3 border border-border bg-card p-3">
              <div className="flex items-start gap-2.5">
                <span className="flex size-7 shrink-0 items-center justify-center bg-fg/10 text-sm font-bold tabular-nums">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  {t.duty && <p className={LABEL}>{t.duty}</p>}
                  <h2 className="text-base font-semibold leading-snug">{t.title}</h2>
                  <p className="mt-0.5 text-[13px] text-muted">{t.payload.prompt}</p>
                </div>
              </div>
              <p className="flex flex-wrap items-center gap-1.5">
                <FormatChip format={t.format} />
                <KindChip kind={t.skill_kind} />
                <span className="text-sm font-semibold">{t.skill_tag}</span>
              </p>
              <div className="flex flex-col gap-1.5">
                <p className={LABEL}>Ask</p>
                <ul className="flex flex-col gap-1.5 text-sm">
                  {questions.map((q) => (
                    <li key={q} className="flex gap-2.5">
                      <span aria-hidden className="mt-0.5 size-4 shrink-0 border border-fg/50" />{q}
                    </li>
                  ))}
                </ul>
              </div>
              <ListenFor items={t.good_looks_like} />
              <NotMeasure text={t.not_measure_note} />
            </article>
          );
        })}

        <p className="text-[12px] text-muted">
          SkillScan demo. Synthetic data only. In a real deployment the builder and booth roles would use authenticated accounts.
        </p>
      </main>
    </div>
  );
}
