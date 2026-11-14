import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Plus } from "lucide-react";
import { RecruiterLang } from "@/components/RecruiterLang";
import { SectionLabel, ScreenTitle } from "@/components/ui/ScreenTitle";
import { joinSep } from "@/components/ui/Sep";
import { bt, type BuilderKey } from "@/lib/i18n-builder";
import { cookieLang } from "@/lib/lang";
import { getCompany, isDemoMode } from "@/lib/recruiter";
import { FORMATS, type Format } from "@/lib/sim";
import { listContests } from "@/lib/sim-store";
import { ResetDemo } from "./ResetDemo";

export const dynamic = "force-dynamic";

const LABEL = "text-[11px] font-semibold uppercase tracking-[0.08em] text-muted";
// Task types grid only (by request); the rest of the UI chrome has no emoji.
// All Emoji 11 or older, so Windows 10 shows them.
const FORMAT_EMOJI: Record<Format, string> = {
  triage: "📋",
  spot_error: "🔍",
  next_step: "🧭",
  apply_rule: "✅",
  read_decide: "📊",
  handover: "📝",
  quick_logic: "🧩",
};

// Contests tab: start a contest (from scratch or a template), the company's
// contests, and the task types.
export default async function ContestsPage(props: PageProps<"/r/[slug]/contests">) {
  const { slug } = await props.params;
  const company = await getCompany(slug);
  if (!company) notFound();
  const [contests, lang] = await Promise.all([listContests(company.id), cookieLang().then((l) => l ?? "en")]);
  const t = (key: BuilderKey, vars?: Record<string, string | number>) => bt(lang, key, vars);

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
          className="tap flex min-h-32 flex-col justify-between gap-6 border border-border bg-card p-5 hover:border-fg/40 md:min-h-44">
          <span className={LABEL}>{t("templatesLabel")}</span>
          <span className="flex items-end justify-between gap-4">
            <span className="min-w-0">
              <span className="block text-xl font-bold leading-tight md:text-2xl">{t("templatesCta")}</span>
              <span className="mt-1.5 block text-[13px] leading-snug text-muted">{t("templatesLine")}</span>
            </span>
            <ArrowRight className="size-6 shrink-0" aria-hidden />
          </span>
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
                  <span className={`inline-flex h-6 shrink-0 items-center border px-2 text-[11px] font-semibold uppercase tracking-[0.08em] ${
                    c.live ? "border-ok/40 text-ok" : "border-border text-muted"}`}>
                    {t(c.live ? "statusLive" : "statusDraft")}
                  </span>
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
        <ul className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2 md:grid-cols-3">
          {FORMATS.map((f) => (
            <li key={f} className="flex flex-col gap-1.5 border border-border bg-card p-3">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold leading-snug">
                <span><span aria-hidden className="mr-1.5">{FORMAT_EMOJI[f]}</span>{t(`fmt_${f}` as BuilderKey)}</span>
                {f === "quick_logic" && <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">{t("optional")}</span>}
              </p>
              <p className="text-[13px] leading-snug">{t(`fmtLine_${f}` as BuilderKey)}</p>
              <p className="mt-auto pt-1 text-[12px] leading-snug text-muted">
                <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-[0.08em]">{t("example")}</span>
                {t(`fmtEx_${f}` as BuilderKey)}
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
