import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/AutoRefresh";
import { FabButton } from "@/components/ui/FabButton";
import { ScreenTitle } from "@/components/ui/ScreenTitle";
import { getCompany, listCandidates } from "@/lib/recruiter";
import { formatClock, formatMinutes, LANG_SHORT } from "@/lib/format";
import type { Stage } from "@/lib/stage";
import { CandidatesView, type CandidateItem } from "./CandidatesView";

export const dynamic = "force-dynamic";

// Where the booth flow stands, shown first in the row (anonymous level).
const STAGE_NOTE: Partial<Record<Stage, string>> = {
  mini_interview: "Short interview",
  contact_requested: "Waiting for candidate details",
  closed: "Not this time",
  contact_declined: "Chose not to share details",
};

// Candidates tab: arrival order (newest first), never sorted by results.
export default async function CandidatesPage(props: PageProps<"/r/[slug]">) {
  const { slug } = await props.params;
  const { find } = await props.searchParams;
  const company = await getCompany(slug);
  if (!company) notFound();
  const rows = await listCandidates(company.id);
  // With several contests, each row says which one the candidate took.
  const manyContests = new Set(rows.map((c) => c.contest_title)).size > 1;

  const items: CandidateItem[] = rows.map((c) => ({
    id: c.id,
    name: c.avatar_name,
    emoji: c.avatar_emoji,
    color: c.avatar_color,
    status: c.status,
    finishedAt: c.finished_at?.getTime() ?? null,
    sub: [
      ...(manyContests ? [c.contest_title] : []),
      ...(STAGE_NOTE[c.stage] ? [STAGE_NOTE[c.stage]!] : []),
      ...(c.finished_at
        ? [`Finished ${formatClock(c.finished_at)}`, formatMinutes(c.total_ms), ...(c.limit_reached ? ["limit reached"] : [])]
        : ["In progress", `${c.answered}/${c.task_count} tasks`]),
      LANG_SHORT[c.lang] ?? c.lang,
    ],
    contact: c.stage === "full_interview" ? c.contact : null,
  }));

  return (
    <div className="flex flex-col gap-4 pt-2">
      <AutoRefresh seconds={10} />
      <ScreenTitle title="Candidates" />
      <CandidatesView slug={slug} items={items} focusCode={find === "1"} />
      <FabButton href={`/r/${slug}/codes?print=1`} label="Print booth codes" />
    </div>
  );
}
