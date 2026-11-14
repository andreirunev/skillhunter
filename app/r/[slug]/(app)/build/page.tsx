import { notFound } from "next/navigation";
import { cookieLang } from "@/lib/lang";
import { getCompany } from "@/lib/recruiter";
import { getLiveTest, listLibrary, listTemplates } from "@/lib/sim-store";
import { Builder, type LiveDraft } from "./Builder";

export const dynamic = "force-dynamic";

// Test builder: role -> duties -> settings and publish. Starts from a role
// template, from scratch, or from the live version.
export default async function BuildPage(props: PageProps<"/r/[slug]/build">) {
  const { slug } = await props.params;
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
  return <Builder slug={slug} initialLang={lang ?? "en"} templates={templates} library={library} live={liveDraft} />;
}
