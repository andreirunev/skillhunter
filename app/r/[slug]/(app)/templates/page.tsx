import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { RecruiterLang } from "@/components/RecruiterLang";
import { SectionLabel } from "@/components/ui/ScreenTitle";
import { joinSep } from "@/components/ui/Sep";
import { bt, type BuilderKey } from "@/lib/i18n-builder";
import { cookieLang } from "@/lib/lang";
import { getCompany } from "@/lib/recruiter";
import { listLibrary, listTemplates } from "@/lib/sim-store";

export const dynamic = "force-dynamic";

const LABEL = "text-[11px] font-semibold uppercase tracking-[0.08em] text-muted";

// Template library: role templates as cards (the grid fills by width, so more
// templates just add rows). A card opens the builder on a new contest; the
// company's existing contests and their attempts are not touched.
export default async function TemplatesPage(props: PageProps<"/r/[slug]/templates">) {
  const { slug } = await props.params;
  const company = await getCompany(slug);
  if (!company) notFound();
  const [templates, library, lang] = await Promise.all([listTemplates(), listLibrary(), cookieLang().then((l) => l ?? "en")]);
  const t = (key: BuilderKey, vars?: Record<string, string | number>) => bt(lang, key, vars);
  const kindOf = new Map(library.map((x) => [x.id, x.skill_kind]));

  return (
    <div className="flex flex-col gap-4 pt-2">
      <Link href={`/r/${slug}/contests`} className="tap -ml-1 inline-flex min-h-11 items-center gap-1 self-start px-1 text-sm font-semibold text-muted">
        <ChevronLeft className="size-4" aria-hidden />{t("backToContests")}
      </Link>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <SectionLabel as="p">{t("templateLibrary")}</SectionLabel>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight">{t("templatesTitle")}</h1>
        </div>
        <RecruiterLang value={lang} label={t("language")} />
      </div>

      <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,14rem),1fr))] gap-2">
        {templates.map((r) => {
          const hard = r.duties.filter((d) => kindOf.get(d.task_id) === "hard").length;
          const soft = r.duties.filter((d) => kindOf.get(d.task_id) === "soft").length;
          return (
            <li key={r.slug}>
              <Link href={`/r/${slug}/build?template=${encodeURIComponent(r.slug)}`}
                className="tap flex h-full min-h-32 flex-col gap-1 border border-border bg-card p-4 hover:border-fg/40">
                <span className="font-semibold leading-snug">{r.name}</span>
                <span className="text-[13px] leading-snug text-muted">{r.summary}</span>
                <span className={`mt-auto pt-2 ${LABEL}`}>
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
  );
}
