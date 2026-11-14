import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/AutoRefresh";
import { ScreenTitle } from "@/components/ui/ScreenTitle";
import { getCompany, listStatRows, type StatRow } from "@/lib/recruiter";
import { StatsView, type Counts } from "./StatsView";

export const dynamic = "force-dynamic";

function count(rows: StatRow[]): Counts {
  const n = (keep: (r: StatRow) => boolean) => rows.filter(keep).length;
  return {
    finished: n((r) => r.finished),
    inProgress: n((r) => !r.finished),
    invited: n((r) => r.status === "invited"),
    atBooth: n((r) => r.status === "at_booth"),
    goodFit: n((r) => r.status === "good_fit"),
    notNow: n((r) => r.status === "not_now"),
  };
}

// Stats tab: event totals only. No scores, no ranking, nothing per candidate.
export default async function StatsPage(props: PageProps<"/r/[slug]/stats">) {
  const { slug } = await props.params;
  const company = await getCompany(slug);
  if (!company) notFound();
  const rows = await listStatRows(company.test_id);

  return (
    <div className="flex flex-col gap-4 pt-2">
      <AutoRefresh seconds={15} />
      <ScreenTitle title="Stats" />
      <StatsView week={count(rows.filter((r) => r.this_week))} all={count(rows)} />
    </div>
  );
}
