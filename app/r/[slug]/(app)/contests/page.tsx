import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { KindChip } from "@/components/GuideParts";
import { RecruiterLang } from "@/components/RecruiterLang";
import { SectionLabel, ScreenTitle } from "@/components/ui/ScreenTitle";
import { joinSep } from "@/components/ui/Sep";
import { bt, type BuilderKey } from "@/lib/i18n-builder";
import { cookieLang } from "@/lib/lang";
import { getCompany, isDemoMode } from "@/lib/recruiter";
import { FORMATS } from "@/lib/sim";
import { getLiveTest, listLibrary, listTemplates } from "@/lib/sim-store";
import { ResetDemo } from "./ResetDemo";

export const dynamic = "force-dynamic";

const LABEL = "text-[11px] font-semibold uppercase tracking-[0.08em] text-muted";
const HOW_STEPS: BuilderKey[] = ["how1", "how2", "how3", "how4"];

// Contests tab: start a contest (from scratch or a role example), the
// company's current contest, and a short manual with the task types.
export default async function ContestsPage(props: PageProps<"/r/[slug]/contests">) {
  const { slug } = await props.params;
  const company = await getCompany(slug);
  if (!company) notFound();
  const [live, templates, library, lang] = await Promise.all([
    getLiveTest(company.id), listTemplates(), listLibrary(), cookieLang().then((l) => l ?? "en"),
  ]);
  const t = (key: BuilderKey, vars?: Record<string, string | number>) => bt(lang, key, vars);
  const kindOf = new Map(library.map((x) => [x.id, x.skill_kind]));
  // Candidates get the contest as soon as it has tasks (a published version
  // or the older task list); drafts live only in the builder until saved.
  const isLive = company.task_count > 0;

  return (
    <div className="flex flex-col gap-6 pt-2">
      <div className="flex items-end justify-between gap-3">
        <ScreenTitle title={t("contests")} />
        <RecruiterLang value={lang} label={t("language")} />
      </div>

      <section className="grid gap-3 md:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
        <Link href={`/r/${slug}/build?new=1`}
          className="ui-btn ui-btn-primary min-h-12 rounded-[2px] text-base md:min-h-32 md:flex-col md:items-start md:justify-between md:self-start md:p-4 md:text-left">
          <Plus className="size-5" aria-hidden />{t("fromScratchCta")}
        </Link>
        <div className="flex flex-col gap-3 border border-border bg-card p-4">
          <h2 className={LABEL}>{t("examplesTitle")}</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {templates.map((r) => {
              const hard = r.duties.filter((d) => kindOf.get(d.task_id) === "hard").length;
              const soft = r.duties.filter((d) => kindOf.get(d.task_id) === "soft").length;
              return (
                <li key={r.slug}>
                  <Link href={`/r/${slug}/build?template=${encodeURIComponent(r.slug)}`}
                    className="tap flex h-full flex-col gap-1 border border-border bg-bg p-3 hover:border-fg/40">
                    <span className="font-semibold leading-snug">{r.name}</span>
                    <span className="text-[13px] leading-snug text-muted">{r.summary}</span>
                    <span className={`mt-auto pt-1.5 ${LABEL}`}>
                      {joinSep([
                        r.duties.length === 1 ? t("oneTask") : t("tasksCount", { n: r.duties.length }),
                        `${hard} ${t("hard")}`,
                        `${soft} ${t("soft")}`,
                      ])}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionLabel>{t("currentContest")}</SectionLabel>
        <div className="border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 font-semibold">{company.test_title}</p>
            <span className={`inline-flex h-6 shrink-0 items-center border px-2 text-[11px] font-semibold uppercase tracking-[0.08em] ${
              isLive ? "border-ok/40 text-ok" : "border-border text-muted"}`}>
              {t(isLive ? "statusLive" : "statusDraft")}
            </span>
          </div>
          <p className="mt-0.5 text-[13px] text-muted">
            {joinSep([
              company.task_count === 1 ? t("oneTask") : t("tasksCount", { n: company.task_count }),
              t("aboutMin", { m: Math.max(1, Math.round(company.expected_sec / 60)) }),
              t("limitMin", { m: company.time_limit_minutes }),
            ])}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/r/${slug}/build`} className="ui-btn ui-btn-primary">{t("editContest")}</Link>
            <Link href={`/r/${slug}/guide`} className="ui-btn ui-btn-secondary">{t("interviewGuide")}</Link>
          </div>
        </div>
      </section>

      {/* What fair organisers would see before the event. */}
      <section className="flex flex-col gap-3">
        <SectionLabel>{t("needsTitle")}</SectionLabel>
        <div className="border border-border bg-card p-4">
          <p className="text-[13px] text-muted">{t("needsHint")}</p>
          {live ? (
            <ol className="mt-3 flex flex-col gap-2.5">
              {live.tasks.map((task, i) => (
                <li key={task.id} className="flex gap-3 text-sm">
                  <span className="flex size-6 shrink-0 items-center justify-center bg-fg/10 text-xs font-bold tabular-nums">{i + 1}</span>
                  <span className="min-w-0">
                    <span className="block font-semibold">{task.duty}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[13px] text-muted">{task.skill_tag}<KindChip kind={task.skill_kind} /></span>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm font-semibold">{t("needsNone")}</p>
          )}
        </div>
      </section>

      <section id="how-to" className="flex scroll-mt-4 flex-col gap-3">
        <SectionLabel>{t("howTitle")}</SectionLabel>
        <div className="flex flex-col gap-4 border border-border bg-card p-4">
          <p className="text-[15px] leading-relaxed">{t("howLead")}</p>
          <ol className="flex flex-col gap-3 text-sm">
            {HOW_STEPS.map((key, i) => (
              <li key={key} className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center bg-fg/10 text-xs font-bold tabular-nums">{i + 1}</span>
                <span className="pt-0.5">{t(key)}</span>
              </li>
            ))}
          </ol>
        </div>

        <h3 className={`mt-2 ${LABEL}`}>{t("taskTypes")}</h3>
        <ul className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {FORMATS.map((f) => (
            <li key={f} className="flex flex-col gap-1.5 border border-border bg-card p-3">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold leading-snug">
                {t(`fmt_${f}` as BuilderKey)}
                {f === "quick_logic" && (
                  <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">{t("optional")}</span>
                )}
              </p>
              <p className="text-[13px] leading-snug">{t(`fmtDo_${f}` as BuilderKey)}</p>
              <p className="mt-auto pt-1 text-[12px] leading-snug text-muted">
                <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-[0.08em]">{t("typicalUse")}</span>
                {t(`fmtUse_${f}` as BuilderKey)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {isDemoMode() && <ResetDemo />}

      <Link href="/" className="ui-btn ui-btn-danger">{t("leave")}</Link>
    </div>
  );
}
