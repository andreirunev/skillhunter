import { notFound } from "next/navigation";
import { cookieLang } from "@/lib/lang";
import { getCompany } from "@/lib/recruiter";
import { getLiveTest, listContests, listLibrary, listTemplates } from "@/lib/sim-store";
import { Builder, type DraftStart, type LiveDraft } from "./Builder";

export const dynamic = "force-dynamic";

// Contest builder: one screen with the task list.
// ?contest=<id> edits that contest (opens on its live version).
// ?template=<slug> or ?new=1 start a new contest, created on the first Save.
// No parameter (older links): the company's first contest.
export default async function BuildPage(props: PageProps<"/r/[slug]/build">) {
  const [{ slug }, sp] = await Promise.all([props.params, props.searchParams]);
  const company = await getCompany(slug);
  if (!company) notFound();
  const [templates, library, contests, lang] = await Promise.all([
    listTemplates(), listLibrary(), listContests(company.id), cookieLang(),
  ]);
  const template = templates.find((t) => t.slug === sp.template) ?? null;
  const isNew = Boolean(template) || sp.new === "1" || contests.length === 0;
  const contest = isNew ? null
    : typeof sp.contest === "string" ? contests.find((c) => c.id === sp.contest) : contests[0];
  if (contest === undefined) notFound();

  const live = contest ? await getLiveTest(contest.id) : null;
  const liveDraft: LiveDraft | null = live && {
    version: live.version,
    title: live.title,
    roleSlug: live.role_slug,
    timeLimit: live.time_limit_minutes,
    englishRequired: live.english_required,
    duties: live.tasks.map((t) => ({ title: t.duty, libraryId: t.library_id, followups: t.followups, good: t.good_looks_like, key: t.key })),
  };
  const start: DraftStart | null = isNew ? { template } : null;
  return (
    <Builder slug={slug} companyName={company.name} lang={lang ?? "en"}
      templates={templates} library={library} contestId={contest?.id ?? null} live={liveDraft} start={start} />
  );
}
