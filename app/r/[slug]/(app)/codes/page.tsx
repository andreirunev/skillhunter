import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/AutoRefresh";
import { ScreenTitle } from "@/components/ui/ScreenTitle";
import { getCompany, listBatches, listCodes } from "@/lib/recruiter";
import { MAX_CODES_PER_BATCH, PRINTED_CODE_DAYS } from "@/lib/codes";
import { formatClock } from "@/lib/format";
import { CodesView } from "./CodesView";

export const dynamic = "force-dynamic";

// Booth codes tab: create and print tickets, reprint recent batches, see
// which codes are still free.
export default async function CodesPage(props: PageProps<"/r/[slug]/codes">) {
  const { slug } = await props.params;
  const { print } = await props.searchParams;
  const company = await getCompany(slug);
  if (!company) notFound();
  const [{ free, taken, codes }, batches] = await Promise.all([listCodes(company.test_id), listBatches(company.test_id)]);

  return (
    <div className="flex flex-col gap-4 pt-2">
      <AutoRefresh seconds={10} />
      <ScreenTitle title="Booth codes" />
      <CodesView slug={slug} free={free} taken={taken} codes={codes}
        batches={batches.map((b) => ({ id: b.id, size: b.size, taken: b.taken, created: formatClock(b.created) }))}
        max={MAX_CODES_PER_BATCH} days={PRINTED_CODE_DAYS} highlight={print === "1"} />
    </div>
  );
}
