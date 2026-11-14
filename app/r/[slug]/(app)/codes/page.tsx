import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/AutoRefresh";
import { ScreenTitle } from "@/components/ui/ScreenTitle";
import { getCompany, listCodes } from "@/lib/recruiter";
import { MAX_CODES_PER_BATCH, PRINTED_CODE_DAYS } from "@/lib/codes";
import { CodesView } from "./CodesView";

export const dynamic = "force-dynamic";

// Booth codes tab: print single-use codes, see which are still free.
export default async function CodesPage(props: PageProps<"/r/[slug]/codes">) {
  const { slug } = await props.params;
  const { print } = await props.searchParams;
  const company = await getCompany(slug);
  if (!company) notFound();
  const { free, taken, codes } = await listCodes(company.test_id);

  return (
    <div className="flex flex-col gap-4 pt-2">
      <AutoRefresh seconds={10} />
      <ScreenTitle title="Booth codes" />
      <CodesView slug={slug} free={free} taken={taken} codes={codes}
        max={MAX_CODES_PER_BATCH} days={PRINTED_CODE_DAYS} highlight={print === "1"} />
    </div>
  );
}
