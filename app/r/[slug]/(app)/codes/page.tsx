import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/AutoRefresh";
import { ScreenTitle } from "@/components/ui/ScreenTitle";
import { getCompany, listBatches, listCodes } from "@/lib/recruiter";
import { MAX_CODES_PER_BATCH, PRINTED_CODE_DAYS } from "@/lib/codes";
import { formatClock } from "@/lib/format";
import { bt } from "@/lib/i18n-builder";
import { cookieLang } from "@/lib/lang";
import { listContests } from "@/lib/sim-store";
import { CodesView } from "./CodesView";

export const dynamic = "force-dynamic";

// Booth codes tab: create and print tickets for one contest, reprint recent
// batches, see which codes are still free (all contests).
export default async function CodesPage(props: PageProps<"/r/[slug]/codes">) {
  const { slug } = await props.params;
  const { print } = await props.searchParams;
  const company = await getCompany(slug);
  if (!company) notFound();
  const [{ free, taken, codes }, batches, contests, lang] = await Promise.all([
    listCodes(company.id), listBatches(company.id), listContests(company.id), cookieLang().then((l) => l ?? "en"),
  ]);
  const live = contests.filter((c) => c.live);

  return (
    <div className="flex flex-col gap-4 pt-2">
      <AutoRefresh seconds={10} />
      <ScreenTitle title="Booth codes" />
      <CodesView slug={slug} free={free} taken={taken} codes={codes}
        contests={contests.map((c) => ({ id: c.id, title: c.title, live: c.live }))}
        preselect={live.length === 1 ? live[0].id : contests.length === 1 ? contests[0].id : ""}
        contestLabels={{ question: bt(lang, "codesFor"), choose: bt(lang, "chooseContest"), draft: bt(lang, "statusDraft") }}
        batches={batches.map((b) => ({ id: b.id, size: b.size, taken: b.taken, created: formatClock(b.created), contest: b.contest_title }))}
        max={MAX_CODES_PER_BATCH} days={PRINTED_CODE_DAYS} highlight={print === "1"} />
    </div>
  );
}
