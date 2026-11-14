import { notFound } from "next/navigation";
import { cookieLang } from "@/lib/lang";
import { getCompany } from "@/lib/recruiter";
import { getLiveTest, listLibrary, listTemplates } from "@/lib/sim-store";
import { Builder, type DraftStart, type LiveDraft } from "./Builder";

export const dynamic = "force-dynamic";

// Contest builder: one screen with the task list. Opens on the live version;
// with none, starts empty or from a role template. From the Contests tab,
// ?template=<slug> or ?new=1 start a new draft (confirmed when one is live).
export default async function BuildPage(props: PageProps<"/r/[slug]/build">) {
  const [{ slug }, sp] = await Promise.all([props.params, props.searchParams]);
  const company = await getCompany(slug);
  if (!company) notFound();
  const [templates, library, live, lang] = await Promise.all([
    listTemplates(), listLibrary(), getLiveTest(company.id), cookieLang(),
  ]);
  const liveDraft: LiveDraft | null = live && {
    version: live.version,
    title: live.title,
    roleSlug: live.role_slug,
    timeLimit: live.time_limit_minutes,
    englishRequired: live.english_required,
    duties: live.tasks.map((t) => ({ title: t.duty, libraryId: t.library_id, followups: t.followups, good: t.good_looks_like, key: t.key })),
  };
  const template = templates.find((t) => t.slug === sp.template) ?? null;
  const start: DraftStart | null = template ? { template } : sp.new === "1" ? { template: null } : null;
  return <Builder slug={slug} companyName={company.name} lang={lang ?? "en"} templates={templates} library={library} live={liveDraft} start={start} />;
}
