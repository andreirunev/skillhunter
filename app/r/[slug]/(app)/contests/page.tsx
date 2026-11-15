import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { RecruiterLang } from "@/components/RecruiterLang";
import { NEW_TASK_FORMATS, TaskTypeCards } from "@/components/TaskTypeCards";
import { SectionLabel, ScreenTitle } from "@/components/ui/ScreenTitle";
import { joinSep } from "@/components/ui/Sep";
import { bt, type BuilderKey } from "@/lib/i18n-builder";
import { cookieLang } from "@/lib/lang";
import { getCompany, isDemoMode } from "@/lib/recruiter";
import { listContests } from "@/lib/sim-store";
import { ContestStatus, type ContestStatusLabels } from "./ContestStatus";
import { ResetDemo } from "./ResetDemo";

export const dynamic = "force-dynamic";

// Template library mark: a 2x2 grid, drawn like the lucide "+" beside it.
function GridIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

// Contests tab: start a contest (from scratch or a template), the company's
// contests, and the three task types offered for new tasks.
export default async function ContestsPage(props: PageProps<"/r/[slug]/contests">) {
  const { slug } = await props.params;
  const company = await getCompany(slug);
  if (!company) notFound();
  const [contests, lang] = await Promise.all([listContests(company.id), cookieLang().then((l) => l ?? "en")]);
  const t = (key: BuilderKey, vars?: Record<string, string | number>) => bt(lang, key, vars);
  const statusLabels: ContestStatusLabels = {
    live: t("statusLive"), offline: t("statusOffline"), draft: t("statusDraft"),
    goOffline: t("goOffline"), goLive: t("goLive"), publishFirst: t("publishFirst"), failed: t("toggleFailed"),
  };

  return (
    <div className="flex flex-col gap-6 pt-2">
      <div className="flex items-end justify-between gap-3">
        <ScreenTitle title={t("contests")} />
        <RecruiterLang value={lang} label={t("language")} />
      </div>

      <section className="grid gap-3 md:grid-cols-2">
        <Link href={`/r/${slug}/build?new=1`}
          className="ui-btn ui-btn-primary min-h-32 flex-col items-start justify-between gap-6 rounded-[2px] p-5 text-left text-xl font-bold md:min-h-44 md:text-2xl">
          <Plus className="size-6" aria-hidden />{t("fromScratchCta")}
        </Link>
        <Link href={`/r/${slug}/templates`}
          className="tap flex min-h-32 flex-col items-start justify-between gap-6 border border-border bg-card p-5 text-left text-xl font-bold leading-tight hover:border-fg/40 md:min-h-44 md:text-2xl">
          <GridIcon className="size-6" />{t("templatesCta")}
        </Link>
      </section>

      <section className="flex flex-col gap-3">
        <SectionLabel>{joinSep([t("currentContests"), contests.length])}</SectionLabel>
        {contests.length === 0 ? (
          <p className="border border-border bg-card p-4 text-sm text-muted">{t("noContests")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {contests.map((c) => (
              <li key={c.id} className="border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 font-semibold leading-snug">{c.title}</p>
                  <ContestStatus slug={slug} contestId={c.id} published={c.published} live={!c.paused} labels={statusLabels} />
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-3">
                  <p className="text-[13px] text-muted">
                    {joinSep([
                      c.task_count === 1 ? t("oneTask") : t("tasksCount", { n: c.task_count }),
                      t("aboutMin", { m: Math.max(1, Math.round(c.expected_sec / 60)) }),
                      t("limitMin", { m: c.time_limit_minutes }),
                    ])}
                  </p>
                  <Link href={`/r/${slug}/build?contest=${c.id}`} className="ui-btn ui-btn-secondary">{t("editContest")}</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <SectionLabel>{t("taskTypes")}</SectionLabel>
        <TaskTypeCards items={NEW_TASK_FORMATS.map((f) => ({ format: f, text: {
          title: t(`fmt_${f}`), line: t(`fmtLine_${f}`), exampleLabel: t("example"), example: t(`fmtEx_${f}`),
        } }))} />
      </section>

      {isDemoMode() && <ResetDemo />}

      <Link href="/" className="ui-btn ui-btn-danger">{t("leave")}</Link>
    </div>
  );
}
