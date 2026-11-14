import { notFound } from "next/navigation";
import { CircleHelp } from "lucide-react";
import { AutoRefresh } from "@/components/AutoRefresh";
import { FabButton } from "@/components/ui/FabButton";
import { ScreenTitle } from "@/components/ui/ScreenTitle";
import { getCompany, listCandidates } from "@/lib/recruiter";
import { formatClock, formatMinutes, LANG_SHORT } from "@/lib/format";
import { CandidatesView, type CandidateItem } from "./CandidatesView";

export const dynamic = "force-dynamic";

// Candidates tab: arrival order (newest first), never sorted by results.
export default async function CandidatesPage(props: PageProps<"/r/[slug]">) {
  const { slug } = await props.params;
  const company = await getCompany(slug);
  if (!company) notFound();
  const rows = await listCandidates(company.test_id);

  const items: CandidateItem[] = rows.map((c) => ({
    id: c.id,
    name: c.avatar_name,
    emoji: c.avatar_emoji,
    color: c.avatar_color,
    status: c.status,
    finishedAt: c.finished_at?.getTime() ?? null,
    sub: [
      c.finished_at
        ? `Finished ${formatClock(c.finished_at)} · ${formatMinutes(c.total_ms)}`
        : `In progress · ${c.answered}/${company.task_count} tasks`,
      LANG_SHORT[c.lang] ?? c.lang,
    ].join(" · "),
    ownPace: c.own_pace,
    inviteCode: c.invite_code,
  }));

  return (
    <div className="flex flex-col gap-4 pt-2">
      <AutoRefresh seconds={10} />
      <ScreenTitle title="Candidates"
        help={{ href: `/r/${slug}/about`, label: "How it works", icon: <CircleHelp className="size-4" aria-hidden /> }} />
      <CandidatesView slug={slug} items={items} />
      <FabButton href={`/r/${slug}/codes?print=1`} label="Print booth codes" />
    </div>
  );
}
